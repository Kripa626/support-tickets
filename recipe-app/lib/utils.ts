import { formatDistanceToNow, parseISO } from 'date-fns';
import { Ingredient } from './types';

export function scaleIngredients(ingredients: Ingredient[], originalServings: number, newServings: number): Ingredient[] {
  const factor = newServings / originalServings;
  return ingredients.map(ing => ({
    ...ing,
    amount: ing.amount != null ? Math.round(ing.amount * factor * 100) / 100 : null,
  }));
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return unit ?? '';
  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾'],
  ];
  const whole = Math.floor(amount);
  const decimal = amount - whole;

  let fractStr = '';
  for (const [val, sym] of fractions) {
    if (Math.abs(decimal - val) < 0.04) { fractStr = sym; break; }
  }

  const numStr = whole > 0
    ? fractStr ? `${whole} ${fractStr}` : `${whole}`
    : fractStr || amount.toString();

  return unit ? `${numStr} ${unit}` : numStr;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function timeAgo(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Never';
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function isInstagramUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\//.test(url);
}

export function groupIngredientsByGroup(ingredients: Ingredient[]): Map<string, Ingredient[]> {
  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const group = ing.group_name ?? '';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(ing);
  }
  return groups;
}
