import { getDatabase } from '../database';
import { ShoppingList, ShoppingListItem, MealPlanItem } from '../types';
import { v4 as uuid } from 'uuid';
import { getPlanItems } from './plans';

const now = () => new Date().toISOString();

export async function getAllShoppingLists(): Promise<ShoppingList[]> {
  const db = await getDatabase();
  return db.getAllAsync<ShoppingList>('SELECT * FROM shopping_lists ORDER BY created_at DESC');
}

export async function getShoppingListById(id: string): Promise<ShoppingList | null> {
  const db = await getDatabase();
  const list = await db.getFirstAsync<ShoppingList>('SELECT * FROM shopping_lists WHERE id = ?', [id]);
  if (!list) return null;
  list.items = await getListItems(id);
  return list;
}

export async function createShoppingList(name: string, mealPlanId?: string): Promise<ShoppingList> {
  const db = await getDatabase();
  const id = uuid();
  const timestamp = now();
  await db.runAsync(
    'INSERT INTO shopping_lists (id, name, meal_plan_id, created_at) VALUES (?, ?, ?, ?)',
    [id, name, mealPlanId ?? null, timestamp]
  );
  return { id, name, meal_plan_id: mealPlanId ?? null, created_at: timestamp, items: [] };
}

export async function deleteShoppingList(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM shopping_lists WHERE id = ?', [id]);
}

export async function addShoppingItem(
  listId: string,
  ingredientName: string,
  amount?: number,
  unit?: string,
  category?: string,
  recipeId?: string
): Promise<ShoppingListItem> {
  const db = await getDatabase();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO shopping_list_items (id, shopping_list_id, ingredient_name, amount, unit, is_checked, category, recipe_id)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, listId, ingredientName, amount ?? null, unit ?? null, category ?? null, recipeId ?? null]
  );
  return { id, shopping_list_id: listId, ingredient_name: ingredientName, amount: amount ?? null, unit: unit ?? null, is_checked: false, category: category ?? null, recipe_id: recipeId ?? null };
}

export async function toggleShoppingItem(id: string, checked: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE shopping_list_items SET is_checked = ? WHERE id = ?', [checked ? 1 : 0, id]);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM shopping_list_items WHERE id = ?', [id]);
}

export async function getListItems(listId: string): Promise<ShoppingListItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT sli.*, r.title as recipe_title FROM shopping_list_items sli
     LEFT JOIN recipes r ON r.id = sli.recipe_id
     WHERE sli.shopping_list_id = ? ORDER BY sli.category, sli.ingredient_name`,
    [listId]
  );
  return rows.map(r => ({ ...r, is_checked: !!r.is_checked, recipe_title: r.recipe_title ?? null }));
}

export async function generateFromPlan(planId: string, listName: string): Promise<ShoppingList> {
  const db = await getDatabase();
  const list = await createShoppingList(listName, planId);
  const items = await getPlanItems(planId);

  for (const item of items) {
    const ingredients = await db.getAllAsync<any>(
      'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index',
      [item.recipe_id]
    );
    const scale = (item.servings ?? 4) / 4;
    for (const ing of ingredients) {
      const scaled = ing.amount ? ing.amount * scale : null;
      await addShoppingItem(list.id, ing.name, scaled ?? undefined, ing.unit ?? undefined, ing.group_name ?? undefined, item.recipe_id);
    }
  }

  return (await getShoppingListById(list.id))!;
}
