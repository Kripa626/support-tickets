import { getDatabase } from '../database';
import { Recipe, Ingredient, Step, Tag, MadeEntry, RecipeLink } from '../types';
import { v4 as uuid } from 'uuid';

const now = () => new Date().toISOString();

export async function getAllRecipes(opts?: {
  search?: string;
  tag?: string;
  minRating?: number;
  favouriteOnly?: boolean;
  starredOnly?: boolean;
  sortBy?: 'title' | 'rating' | 'created_at' | 'last_made';
  sortDir?: 'ASC' | 'DESC';
}): Promise<Recipe[]> {
  const db = await getDatabase();
  let query = `
    SELECT r.*,
      COUNT(mh.id) as made_count,
      MAX(mh.made_at) as last_made_at
    FROM recipes r
    LEFT JOIN made_history mh ON mh.recipe_id = r.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (opts?.tag) {
    query += ` LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id LEFT JOIN tags t ON t.id = rt.tag_id`;
    conditions.push('t.name = ?');
    params.push(opts.tag);
  }

  if (opts?.search) {
    conditions.push(`(r.title LIKE ? OR r.description LIKE ? OR r.notes LIKE ?)`);
    const s = `%${opts.search}%`;
    params.push(s, s, s);
  }
  if (opts?.minRating) {
    conditions.push('r.rating >= ?');
    params.push(opts.minRating);
  }
  if (opts?.favouriteOnly) conditions.push('r.is_favourite = 1');
  if (opts?.starredOnly) conditions.push('r.is_starred = 1');

  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ` GROUP BY r.id`;

  const sortMap: Record<string, string> = {
    title: 'r.title',
    rating: 'r.rating',
    created_at: 'r.created_at',
    last_made: 'last_made_at',
  };
  const sortCol = sortMap[opts?.sortBy ?? 'created_at'] ?? 'r.created_at';
  const sortDir = opts?.sortDir ?? 'DESC';
  query += ` ORDER BY ${sortCol} ${sortDir}`;

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(rowToRecipe);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT r.*, COUNT(mh.id) as made_count, MAX(mh.made_at) as last_made_at
     FROM recipes r LEFT JOIN made_history mh ON mh.recipe_id = r.id
     WHERE r.id = ? GROUP BY r.id`,
    [id]
  );
  if (!row) return null;

  const recipe = rowToRecipe(row);
  recipe.ingredients = await getIngredients(id);
  recipe.steps = await getSteps(id);
  recipe.tags = await getRecipeTags(id);
  recipe.made_history = await getMadeHistory(id);
  recipe.links = await getRecipeLinks(id);
  return recipe;
}

export async function createRecipe(data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
  const db = await getDatabase();
  const id = uuid();
  const timestamp = now();
  await db.runAsync(
    `INSERT INTO recipes (id, title, description, source_url, source_type, image_url, servings, prep_time, cook_time, rating, is_favourite, is_starred, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.title, data.description ?? null, data.source_url ?? null, data.source_type,
     data.image_url ?? null, data.servings, data.prep_time ?? null, data.cook_time ?? null,
     data.rating ?? null, data.is_favourite ? 1 : 0, data.is_starred ? 1 : 0,
     data.notes ?? null, timestamp, timestamp]
  );

  if (data.ingredients?.length) await saveIngredients(id, data.ingredients);
  if (data.steps?.length) await saveSteps(id, data.steps);
  if (data.tags?.length) await saveRecipeTags(id, data.tags);

  return (await getRecipeById(id))!;
}

export async function updateRecipe(id: string, data: Partial<Recipe>): Promise<void> {
  const db = await getDatabase();
  const timestamp = now();
  const fields: string[] = [];
  const params: any[] = [];

  const mappable: (keyof Recipe)[] = [
    'title', 'description', 'source_url', 'source_type', 'image_url',
    'servings', 'prep_time', 'cook_time', 'rating', 'notes',
  ];
  for (const key of mappable) {
    if (key in data) {
      fields.push(`${key} = ?`);
      params.push((data as any)[key] ?? null);
    }
  }
  if ('is_favourite' in data) { fields.push('is_favourite = ?'); params.push(data.is_favourite ? 1 : 0); }
  if ('is_starred' in data) { fields.push('is_starred = ?'); params.push(data.is_starred ? 1 : 0); }
  fields.push('updated_at = ?');
  params.push(timestamp);
  params.push(id);

  if (fields.length > 1) {
    await db.runAsync(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  if (data.ingredients !== undefined) await saveIngredients(id, data.ingredients);
  if (data.steps !== undefined) await saveSteps(id, data.steps);
  if (data.tags !== undefined) await saveRecipeTags(id, data.tags);
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function addMadeEntry(recipeId: string, servings?: number, notes?: string): Promise<MadeEntry> {
  const db = await getDatabase();
  const id = uuid();
  const madeAt = now();
  await db.runAsync(
    'INSERT INTO made_history (id, recipe_id, made_at, servings, notes) VALUES (?, ?, ?, ?, ?)',
    [id, recipeId, madeAt, servings ?? null, notes ?? null]
  );
  return { id, recipe_id: recipeId, made_at: madeAt, servings: servings ?? null, notes: notes ?? null };
}

export async function deleteMadeEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM made_history WHERE id = ?', [id]);
}

export async function addRecipeLink(
  recipeId: string, linkedId: string, linkType: string, note?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO recipe_links (id, recipe_id, linked_recipe_id, link_type, note) VALUES (?, ?, ?, ?, ?)',
    [uuid(), recipeId, linkedId, linkType, note ?? null]
  );
}

export async function deleteRecipeLink(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipe_links WHERE id = ?', [id]);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function rowToRecipe(row: any): Recipe {
  return {
    ...row,
    is_favourite: !!row.is_favourite,
    is_starred: !!row.is_starred,
    made_count: Number(row.made_count ?? 0),
    last_made_at: row.last_made_at ?? null,
  };
}

async function getIngredients(recipeId: string): Promise<Ingredient[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ingredient>(
    'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index',
    [recipeId]
  );
}

async function getSteps(recipeId: string): Promise<Step[]> {
  const db = await getDatabase();
  return db.getAllAsync<Step>(
    'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index',
    [recipeId]
  );
}

export async function getRecipeTags(recipeId: string): Promise<Tag[]> {
  const db = await getDatabase();
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t JOIN recipe_tags rt ON rt.tag_id = t.id WHERE rt.recipe_id = ? ORDER BY t.name`,
    [recipeId]
  );
}

async function getMadeHistory(recipeId: string): Promise<MadeEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<MadeEntry>(
    'SELECT * FROM made_history WHERE recipe_id = ? ORDER BY made_at DESC',
    [recipeId]
  );
}

async function getRecipeLinks(recipeId: string): Promise<RecipeLink[]> {
  const db = await getDatabase();
  const links = await db.getAllAsync<any>(
    `SELECT rl.*, r.title as linked_title, r.image_url as linked_image_url
     FROM recipe_links rl JOIN recipes r ON r.id = rl.linked_recipe_id
     WHERE rl.recipe_id = ?`,
    [recipeId]
  );
  return links.map(l => ({
    id: l.id,
    recipe_id: l.recipe_id,
    linked_recipe_id: l.linked_recipe_id,
    link_type: l.link_type,
    note: l.note,
    linked_recipe: { id: l.linked_recipe_id, title: l.linked_title, image_url: l.linked_image_url } as Recipe,
  }));
}

async function saveIngredients(recipeId: string, ingredients: Ingredient[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    await db.runAsync(
      'INSERT INTO ingredients (id, recipe_id, name, amount, unit, group_name, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ing.id || uuid(), recipeId, ing.name, ing.amount ?? null, ing.unit ?? null, ing.group_name ?? null, i]
    );
  }
}

async function saveSteps(recipeId: string, steps: Step[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM steps WHERE recipe_id = ?', [recipeId]);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    await db.runAsync(
      'INSERT INTO steps (id, recipe_id, order_index, description, tip) VALUES (?, ?, ?, ?, ?)',
      [step.id || uuid(), recipeId, i, step.description, step.tip ?? null]
    );
  }
}

async function saveRecipeTags(recipeId: string, tags: Tag[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipe_tags WHERE recipe_id = ?', [recipeId]);
  for (const tag of tags) {
    await db.runAsync(
      'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
      [recipeId, tag.id]
    );
  }
}
