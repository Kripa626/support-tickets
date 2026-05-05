import { create } from 'zustand';
import { Recipe, Tag, MealPlan, ShoppingList } from '../lib/types';
import { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, addMadeEntry } from '../lib/db/recipes';
import { getAllTags, getTagsWithCount } from '../lib/db/tags';
import { getAllPlans, getPlanById, createPlan, deletePlan } from '../lib/db/plans';
import { getAllShoppingLists, getShoppingListById, deleteShoppingList } from '../lib/db/shopping';

interface FilterState {
  search: string;
  tag: string | null;
  minRating: number | null;
  favouriteOnly: boolean;
  starredOnly: boolean;
  sortBy: 'title' | 'rating' | 'created_at' | 'last_made';
  sortDir: 'ASC' | 'DESC';
}

interface RecipeStore {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  tags: (Tag & { count: number })[];
  plans: MealPlan[];
  selectedPlan: MealPlan | null;
  shoppingLists: ShoppingList[];
  selectedShoppingList: ShoppingList | null;
  filters: FilterState;
  loading: boolean;
  error: string | null;

  // recipes
  loadRecipes: () => Promise<void>;
  loadRecipe: (id: string) => Promise<void>;
  addRecipe: (data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<Recipe>;
  editRecipe: (id: string, data: Partial<Recipe>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  markAsMade: (id: string, servings?: number, notes?: string) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  setRating: (id: string, rating: number | null) => Promise<void>;

  // filters
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;

  // tags
  loadTags: () => Promise<void>;

  // plans
  loadPlans: () => Promise<void>;
  loadPlan: (id: string) => Promise<void>;
  addPlan: (name: string, startDate?: string, endDate?: string) => Promise<MealPlan>;
  removePlan: (id: string) => Promise<void>;

  // shopping
  loadShoppingLists: () => Promise<void>;
  loadShoppingList: (id: string) => Promise<void>;
  removeShoppingList: (id: string) => Promise<void>;

  clearError: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  tag: null,
  minRating: null,
  favouriteOnly: false,
  starredOnly: false,
  sortBy: 'created_at',
  sortDir: 'DESC',
};

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  selectedRecipe: null,
  tags: [],
  plans: [],
  selectedPlan: null,
  shoppingLists: [],
  selectedShoppingList: null,
  filters: DEFAULT_FILTERS,
  loading: false,
  error: null,

  loadRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const recipes = await getAllRecipes({
        search: filters.search || undefined,
        tag: filters.tag ?? undefined,
        minRating: filters.minRating ?? undefined,
        favouriteOnly: filters.favouriteOnly || undefined,
        starredOnly: filters.starredOnly || undefined,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      });
      set({ recipes, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadRecipe: async (id) => {
    set({ loading: true, error: null });
    try {
      const recipe = await getRecipeById(id);
      set({ selectedRecipe: recipe, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addRecipe: async (data) => {
    set({ loading: true });
    try {
      const recipe = await createRecipe(data);
      set(state => ({ recipes: [recipe, ...state.recipes], loading: false }));
      return recipe;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  editRecipe: async (id, data) => {
    await updateRecipe(id, data);
    const recipe = await getRecipeById(id);
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? { ...r, ...recipe } : r),
      selectedRecipe: state.selectedRecipe?.id === id ? recipe : state.selectedRecipe,
    }));
  },

  removeRecipe: async (id) => {
    await deleteRecipe(id);
    set(state => ({ recipes: state.recipes.filter(r => r.id !== id), selectedRecipe: null }));
  },

  markAsMade: async (id, servings, notes) => {
    await addMadeEntry(id, servings, notes);
    await get().loadRecipe(id);
    set(state => ({
      recipes: state.recipes.map(r =>
        r.id === id ? { ...r, made_count: (r.made_count ?? 0) + 1, last_made_at: new Date().toISOString() } : r
      ),
    }));
  },

  toggleFavourite: async (id) => {
    const recipe = get().recipes.find(r => r.id === id) ?? get().selectedRecipe;
    if (!recipe) return;
    await updateRecipe(id, { is_favourite: !recipe.is_favourite });
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? { ...r, is_favourite: !r.is_favourite } : r),
      selectedRecipe: state.selectedRecipe?.id === id
        ? { ...state.selectedRecipe, is_favourite: !state.selectedRecipe.is_favourite }
        : state.selectedRecipe,
    }));
  },

  toggleStar: async (id) => {
    const recipe = get().recipes.find(r => r.id === id) ?? get().selectedRecipe;
    if (!recipe) return;
    await updateRecipe(id, { is_starred: !recipe.is_starred });
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? { ...r, is_starred: !r.is_starred } : r),
      selectedRecipe: state.selectedRecipe?.id === id
        ? { ...state.selectedRecipe, is_starred: !state.selectedRecipe.is_starred }
        : state.selectedRecipe,
    }));
  },

  setRating: async (id, rating) => {
    await updateRecipe(id, { rating: rating ?? undefined });
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? { ...r, rating } : r),
      selectedRecipe: state.selectedRecipe?.id === id
        ? { ...state.selectedRecipe, rating }
        : state.selectedRecipe,
    }));
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value } }));
  },

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  loadTags: async () => {
    const tags = await getTagsWithCount();
    set({ tags });
  },

  loadPlans: async () => {
    const plans = await getAllPlans();
    set({ plans });
  },

  loadPlan: async (id) => {
    const plan = await getPlanById(id);
    set({ selectedPlan: plan });
  },

  addPlan: async (name, startDate, endDate) => {
    const plan = await createPlan(name, startDate, endDate);
    set(state => ({ plans: [plan, ...state.plans] }));
    return plan;
  },

  removePlan: async (id) => {
    await deletePlan(id);
    set(state => ({ plans: state.plans.filter(p => p.id !== id) }));
  },

  loadShoppingLists: async () => {
    const lists = await getAllShoppingLists();
    set({ shoppingLists: lists });
  },

  loadShoppingList: async (id) => {
    const list = await getShoppingListById(id);
    set({ selectedShoppingList: list });
  },

  removeShoppingList: async (id) => {
    await deleteShoppingList(id);
    set(state => ({ shoppingLists: state.shoppingLists.filter(l => l.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
