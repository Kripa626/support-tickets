import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Recipe } from '../lib/types';
import { RatingStars } from './RatingStars';
import { TagChip } from './TagChip';
import { formatDuration, timeAgo } from '../lib/utils';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  onFavourite?: () => void;
  onStar?: () => void;
}

export function RecipeCard({ recipe, onPress, onFavourite, onStar }: Props) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={onStar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.icon, recipe.is_starred && styles.iconActive]}>⭐</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onFavourite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.icon, recipe.is_favourite && styles.heartActive]}>
                {recipe.is_favourite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {recipe.rating != null && (
          <RatingStars rating={recipe.rating} size={14} readonly />
        )}

        <View style={styles.metaRow}>
          {totalTime > 0 && <Text style={styles.meta}>⏱ {formatDuration(totalTime)}</Text>}
          {(recipe.servings ?? 0) > 0 && <Text style={styles.meta}>👥 {recipe.servings}</Text>}
          {(recipe.made_count ?? 0) > 0 && (
            <Text style={styles.meta}>✓ Made {recipe.made_count}×</Text>
          )}
        </View>

        {recipe.last_made_at && (
          <Text style={styles.lastMade}>Last cooked {timeAgo(recipe.last_made_at)}</Text>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map(tag => (
              <TagChip key={tag.id} tag={tag} size="sm" />
            ))}
            {recipe.tags.length > 3 && (
              <Text style={styles.moreTags}>+{recipe.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 48 },
  content: { padding: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  iconRow: { flexDirection: 'row', gap: 4 },
  icon: { fontSize: 18, opacity: 0.4 },
  iconActive: { opacity: 1 },
  heartActive: { opacity: 1 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  lastMade: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -3 },
  moreTags: { fontSize: 11, color: '#9CA3AF', alignSelf: 'center', marginLeft: 4 },
});
