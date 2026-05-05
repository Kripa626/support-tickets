import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';
import { ParsedRecipe } from './types';

const API_KEY_STORAGE = 'anthropic_api_key';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORAGE);
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE, key);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE);
}

function getClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

const RECIPE_SYSTEM_PROMPT = `You are a recipe extraction assistant. When given text from a webpage, Instagram post, or any other source, extract the recipe information and return it as a JSON object.

The JSON must have exactly this structure:
{
  "title": "string",
  "description": "string or null",
  "servings": number or null,
  "prep_time": number in minutes or null,
  "cook_time": number in minutes or null,
  "ingredients": [
    { "name": "string", "amount": number or null, "unit": "string or null", "group": "string or null" }
  ],
  "steps": [
    { "description": "string", "tip": "string or null" }
  ],
  "tags": ["string"]
}

For tags, suggest relevant category tags like cuisine type (italian, asian, mexican), diet (vegetarian, vegan, gluten-free), meal type (breakfast, dinner, dessert, snack), cooking method (baked, grilled, slow-cooker), or occasion (weeknight, holiday, quick).

Return ONLY the JSON, no other text.`;

export async function parseRecipeFromUrl(url: string, apiKey: string): Promise<ParsedRecipe> {
  const client = getClient(apiKey);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: RECIPE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please extract the recipe from this URL: ${url}\n\nIf you cannot access the URL directly, please ask me to paste the content. Try to fetch and parse it as a recipe.`,
      },
    ],
  });

  return parseClaudeResponse(message, url);
}

export async function parseRecipeFromText(text: string, apiKey: string, sourceUrl?: string): Promise<ParsedRecipe> {
  const client = getClient(apiKey);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: RECIPE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please extract the recipe from this content:\n\n${text}`,
      },
    ],
  });

  const parsed = parseClaudeResponse(message, sourceUrl);
  if (sourceUrl) parsed.source_url = sourceUrl;
  return parsed;
}

export async function parseRecipeFromImage(base64Image: string, mimeType: string, apiKey: string): Promise<ParsedRecipe> {
  const client = getClient(apiKey);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: RECIPE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as any, data: base64Image },
          },
          {
            type: 'text',
            text: 'Please extract the recipe from this image.',
          },
        ],
      },
    ],
  });

  return parseClaudeResponse(message);
}

export async function suggestTags(title: string, description: string, ingredients: string[], apiKey: string): Promise<string[]> {
  const client = getClient(apiKey);
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Suggest 3-6 relevant tags for this recipe as a JSON array of strings. Only return the JSON array.
Title: ${title}
Description: ${description}
Key ingredients: ${ingredients.slice(0, 8).join(', ')}`,
      },
    ],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

function parseClaudeResponse(message: Anthropic.Message, sourceUrl?: string): ParsedRecipe {
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  let text = content.text.trim();
  // Strip markdown code blocks if present
  text = text.replace(/^```json\n?|\n?```$/g, '').trim();
  text = text.replace(/^```\n?|\n?```$/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse recipe from Claude response. The content may not contain a recognizable recipe.');
  }

  if (!parsed.title || !Array.isArray(parsed.ingredients)) {
    throw new Error('The extracted content does not appear to be a recipe.');
  }

  return {
    title: parsed.title,
    description: parsed.description ?? undefined,
    servings: parsed.servings ?? undefined,
    prep_time: parsed.prep_time ?? undefined,
    cook_time: parsed.cook_time ?? undefined,
    ingredients: (parsed.ingredients ?? []).map((i: any) => ({
      name: i.name,
      amount: i.amount ?? undefined,
      unit: i.unit ?? undefined,
      group: i.group ?? undefined,
    })),
    steps: (parsed.steps ?? []).map((s: any) => ({
      description: typeof s === 'string' ? s : s.description,
      tip: s.tip ?? undefined,
    })),
    tags: parsed.tags ?? [],
    source_url: sourceUrl,
  };
}
