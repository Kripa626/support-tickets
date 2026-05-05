export type SourceType = 'url' | 'instagram' | 'manual' | 'app';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type LinkType = 'sauce' | 'side' | 'base' | 'variation' | 'other';

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  order_index: number;
  group_name: string | null;
}

export interface Step {
  id: string;
  recipe_id: string;
  order_index: number;
  description: string;
  tip: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface MadeEntry {
  id: string;
  recipe_id: string;
  made_at: string;
  servings: number | null;
  notes: string | null;
}

export interface RecipeLink {
  id: string;
  recipe_id: string;
  linked_recipe_id: string;
  link_type: LinkType;
  note: string | null;
  linked_recipe?: Recipe;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  source_type: SourceType;
  image_url: string | null;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  rating: number | null;
  is_favourite: boolean;
  is_starred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  ingredients?: Ingredient[];
  steps?: Step[];
  tags?: Tag[];
  made_history?: MadeEntry[];
  links?: RecipeLink[];
  made_count?: number;
  last_made_at?: string | null;
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: MealType;
  servings: number;
  recipe?: Recipe;
}

export interface MealPlan {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  items?: MealPlanItem[];
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_name: string;
  amount: number | null;
  unit: string | null;
  is_checked: boolean;
  category: string | null;
  recipe_id: string | null;
  recipe_title?: string | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  meal_plan_id: string | null;
  created_at: string;
  items?: ShoppingListItem[];
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  ingredients: Array<{
    name: string;
    amount?: number;
    unit?: string;
    group?: string;
  }>;
  steps: Array<{ description: string; tip?: string }>;
  tags?: string[];
  source_url?: string;
}
