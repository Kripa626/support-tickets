import { getDatabase } from '../database';
import { Tag } from '../types';
import { v4 as uuid } from 'uuid';

const TAG_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
];

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDatabase();
  return db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name');
}

export async function getTagsWithCount(): Promise<(Tag & { count: number })[]> {
  const db = await getDatabase();
  return db.getAllAsync<Tag & { count: number }>(
    `SELECT t.*, COUNT(rt.recipe_id) as count
     FROM tags t LEFT JOIN recipe_tags rt ON rt.tag_id = t.id
     GROUP BY t.id ORDER BY t.name`
  );
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const db = await getDatabase();
  const normalized = name.trim().toLowerCase();
  const existing = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE name = ?', [normalized]);
  if (existing) return existing;
  const id = uuid();
  const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  await db.runAsync('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)', [id, normalized, color]);
  return { id, name: normalized, color };
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  return getOrCreateTag(name);
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

export async function updateTagColor(id: string, color: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE tags SET color = ? WHERE id = ?', [color, id]);
}
