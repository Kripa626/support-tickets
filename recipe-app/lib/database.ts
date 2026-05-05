import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('recipebook.db');
    await setupDatabase(db);
  }
  return db;
}

async function setupDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      source_url TEXT,
      source_type TEXT NOT NULL DEFAULT 'manual',
      image_url TEXT,
      servings INTEGER NOT NULL DEFAULT 4,
      prep_time INTEGER,
      cook_time INTEGER,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      is_favourite INTEGER NOT NULL DEFAULT 0,
      is_starred INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL,
      unit TEXT,
      group_name TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      tip TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_tags (
      recipe_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (recipe_id, tag_id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS made_history (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      made_at TEXT NOT NULL,
      servings INTEGER,
      notes TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_links (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      linked_recipe_id TEXT NOT NULL,
      link_type TEXT NOT NULL DEFAULT 'other',
      note TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plan_items (
      id TEXT PRIMARY KEY,
      meal_plan_id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'dinner',
      servings INTEGER NOT NULL DEFAULT 4,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shopping_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      meal_plan_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id TEXT PRIMARY KEY,
      shopping_list_id TEXT NOT NULL,
      ingredient_name TEXT NOT NULL,
      amount REAL,
      unit TEXT,
      is_checked INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      recipe_id TEXT,
      FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
    );
  `);
}
