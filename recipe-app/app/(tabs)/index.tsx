import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { RecipeCard } from '../../components/RecipeCard';
import { TagChip } from '../../components/TagChip';
import { RatingStars } from '../../components/RatingStars';

const SORT_OPTIONS = [
  { key: 'created_at', label: 'Newest' },
  { key: 'title', label: 'A–Z' },
  { key: 'rating', label: 'Rating' },
  { key: 'last_made', label: 'Last made' },
] as const;

export default function RecipesScreen() {
  const { recipes, tags, filters, loading, loadRecipes, loadTags, setFilter, resetFilters, toggleFavourite, toggleStar } = useRecipeStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [filters]);

  const onRefresh = useCallback(() => loadRecipes(), []);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes…"
          placeholderTextColor="#9CA3AF"
          value={filters.search}
          onChangeText={v => setFilter('search', v)}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(f => !f)}>
          <Text style={styles.filterBtnText}>{showFilters ? '✕' : '⊞'} Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => router.push('/import')}
        >
          <Text style={styles.importBtnText}>＋ Import</Text>
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Quick toggles */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleRow} contentContainerStyle={styles.toggleContent}>
            <TouchableOpacity
              style={[styles.toggle, filters.favouriteOnly && styles.toggleActive]}
              onPress={() => setFilter('favouriteOnly', !filters.favouriteOnly)}
            >
              <Text style={styles.toggleText}>❤️ Favourites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, filters.starredOnly && styles.toggleActive]}
              onPress={() => setFilter('starredOnly', !filters.starredOnly)}
            >
              <Text style={styles.toggleText}>⭐ Starred</Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.toggle, filters.minRating === r && styles.toggleActive]}
                onPress={() => setFilter('minRating', filters.minRating === r ? null : r)}
              >
                <Text style={styles.toggleText}>{'★'.repeat(r)}+ </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleRow} contentContainerStyle={styles.toggleContent}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.toggle, filters.sortBy === opt.key && styles.toggleActive]}
                onPress={() => setFilter('sortBy', opt.key)}
              >
                <Text style={styles.toggleText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.toggle, filters.sortDir === 'ASC' && styles.toggleActive]}
              onPress={() => setFilter('sortDir', filters.sortDir === 'ASC' ? 'DESC' : 'ASC')}
            >
              <Text style={styles.toggleText}>{filters.sortDir === 'ASC' ? '↑ Asc' : '↓ Desc'}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Tags */}
          {tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {tags.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={filters.tag === tag.name}
                  onPress={() => setFilter('tag', filters.tag === tag.name ? null : tag.name)}
                  size="sm"
                />
              ))}
            </ScrollView>
          )}

          <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={recipes}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
            onFavourite={() => toggleFavourite(item.id)}
            onStar={() => toggleStar(item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "＋ Import" to capture a recipe from a URL, Instagram, or paste text.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/recipe/new')}>
              <Text style={styles.emptyBtnText}>Add manually</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={recipes.length === 0 && styles.emptyContainer}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/recipe/new')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: '#111827' },
  filterBtn: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  importBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  importBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  filterPanel: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 8 },
  toggleRow: { paddingLeft: 12 },
  toggleContent: { paddingRight: 12, gap: 6 },
  toggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 6 },
  toggleActive: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tagRow: { paddingHorizontal: 12, paddingTop: 6, flexDirection: 'row', gap: 0 },
  resetBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 6 },
  resetText: { fontSize: 12, color: '#6B7280', textDecorationLine: 'underline' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyContainer: { flexGrow: 1 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '700' },
});
