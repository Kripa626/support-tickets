import { getDatabase } from '../database';
import { MealPlan, MealPlanItem } from '../types';
import { v4 as uuid } from 'uuid';

const now = () => new Date().toISOString();

export async function getAllPlans(): Promise<MealPlan[]> {
  const db = await getDatabase();
  return db.getAllAsync<MealPlan>('SELECT * FROM meal_plans ORDER BY created_at DESC');
}

export async function getPlanById(id: string): Promise<MealPlan | null> {
  const db = await getDatabase();
  const plan = await db.getFirstAsync<MealPlan>('SELECT * FROM meal_plans WHERE id = ?', [id]);
  if (!plan) return null;
  plan.items = await getPlanItems(id);
  return plan;
}

export async function createPlan(name: string, startDate?: string, endDate?: string): Promise<MealPlan> {
  const db = await getDatabase();
  const id = uuid();
  const timestamp = now();
  await db.runAsync(
    'INSERT INTO meal_plans (id, name, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, startDate ?? null, endDate ?? null, timestamp]
  );
  return { id, name, start_date: startDate ?? null, end_date: endDate ?? null, created_at: timestamp, items: [] };
}

export async function deletePlan(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plans WHERE id = ?', [id]);
}

export async function addPlanItem(
  planId: string, recipeId: string, plannedDate: string, mealType: string, servings: number
): Promise<MealPlanItem> {
  const db = await getDatabase();
  const id = uuid();
  await db.runAsync(
    'INSERT INTO meal_plan_items (id, meal_plan_id, recipe_id, planned_date, meal_type, servings) VALUES (?, ?, ?, ?, ?, ?)',
    [id, planId, recipeId, plannedDate, mealType, servings]
  );
  return { id, meal_plan_id: planId, recipe_id: recipeId, planned_date: plannedDate, meal_type: mealType as any, servings };
}

export async function removePlanItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plan_items WHERE id = ?', [id]);
}

export async function getPlanItems(planId: string): Promise<MealPlanItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<MealPlanItem>(
    `SELECT mpi.*, r.title as recipe_title, r.image_url as recipe_image
     FROM meal_plan_items mpi JOIN recipes r ON r.id = mpi.recipe_id
     WHERE mpi.meal_plan_id = ? ORDER BY mpi.planned_date, mpi.meal_type`,
    [planId]
  );
}
