import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Linking, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { RatingStars } from '../../components/RatingStars';
import { TagChip } from '../../components/TagChip';
import { IngredientsList } from '../../components/IngredientsList';
import { StepsList } from '../../components/StepsList';
import { ServingsControl } from '../../components/ServingsControl';
import { formatDuration, formatDate, timeAgo } from '../../lib/utils';
import { deleteRecipeLink } from '../../lib/db/recipes';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedRecipe, loadRecipe, toggleFavourite, toggleStar, setRating, markAsMade, removeRecipe, editRecipe } = useRecipeStore();
  const [servings, setServings] = useState(4);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'history' | 'notes'>('ingredients');
  const [showMadeModal, setShowMadeModal] = useState(false);
  const [madeNotes, setMadeNotes] = useState('');
  const [madeServings, setMadeServings] = useState(4);

  useEffect(() => {
    if (id) loadRecipe(id);
  }, [id]);

  useEffect(() => {
    if (selectedRecipe) setServings(selectedRecipe.servings);
  }, [selectedRecipe?.id]);

  if (!selectedRecipe) {
    return <View style={styles.center}><Text>Loading…</Text></View>;
  }

  const recipe = selectedRecipe;
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  const handleDelete = () => {
    Alert.alert('Delete Recipe', `Delete "${recipe.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await removeRecipe(recipe.id); router.back(); } },
    ]);
  };

  const handleMarkMade = async () => {
    await markAsMade(recipe.id, madeServings, madeNotes || undefined);
    setShowMadeModal(false);
    setMadeNotes('');
  };

  const handleRemoveLink = async (linkId: string) => {
    await deleteRecipeLink(linkId);
    await loadRecipe(recipe.id);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12, paddingRight: 4 }}>
              <TouchableOpacity onPress={() => router.push(`/recipe/edit/${recipe.id}`)}>
                <Text style={{ fontSize: 16, color: '#10B981', fontWeight: '600' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={{ fontSize: 16, color: '#EF4444' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero image */}
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>🍽️</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => toggleStar(recipe.id)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>{recipe.is_starred ? '⭐' : '☆'} Star</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavourite(recipe.id)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>{recipe.is_favourite ? '❤️' : '🤍'} Fav</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setMadeServings(recipe.servings); setShowMadeModal(true); }}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
            >
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>✓ Made it!</Text>
            </TouchableOpacity>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <RatingStars
              rating={recipe.rating}
              onRate={r => setRating(recipe.id, r === recipe.rating ? null : r)}
              size={28}
            />
            {recipe.rating && <Text style={styles.ratingLabel}>{recipe.rating}/5</Text>}
          </View>

          {/* Meta */}
          <View style={styles.metaGrid}>
            {recipe.prep_time && (
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{formatDuration(recipe.prep_time)}</Text>
                <Text style={styles.metaLabel}>Prep</Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{formatDuration(recipe.cook_time)}</Text>
                <Text style={styles.metaLabel}>Cook</Text>
              </View>
            )}
            {totalTime > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{formatDuration(totalTime)}</Text>
                <Text style={styles.metaLabel}>Total</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{recipe.made_count ?? 0}×</Text>
              <Text style={styles.metaLabel}>Made</Text>
            </View>
          </View>

          {recipe.last_made_at && (
            <Text style={styles.lastMade}>Last cooked {timeAgo(recipe.last_made_at)}</Text>
          )}

          {/* Servings control */}
          <View style={styles.servingsRow}>
            <ServingsControl servings={servings} onChange={setServings} />
          </View>

          {/* Description */}
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.tagRow}>
              {recipe.tags.map(tag => <TagChip key={tag.id} tag={tag} />)}
            </View>
          )}

          {/* Source */}
          {recipe.source_url && (
            <TouchableOpacity onPress={() => Linking.openURL(recipe.source_url!)}>
              <Text style={styles.sourceLink}>🔗 View original source</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['ingredients', 'steps', 'notes', 'history'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'ingredients' ? '🥗 Ingredients' :
                 tab === 'steps' ? '📋 Steps' :
                 tab === 'notes' ? '📝 Notes' : `📅 History (${recipe.made_history?.length ?? 0})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'ingredients' && recipe.ingredients && (
            <IngredientsList
              ingredients={recipe.ingredients}
              originalServings={recipe.servings}
              currentServings={servings}
            />
          )}

          {activeTab === 'steps' && recipe.steps && (
            <StepsList steps={recipe.steps} />
          )}

          {activeTab === 'notes' && (
            <View>
              <Text style={styles.notesText}>{recipe.notes || 'No notes yet. Tap Edit to add notes.'}</Text>

              {/* Linked recipes */}
              {recipe.links && recipe.links.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Linked Recipes</Text>
                  {recipe.links.map(link => (
                    <View key={link.id} style={styles.linkRow}>
                      <TouchableOpacity
                        style={styles.linkCard}
                        onPress={() => router.push(`/recipe/${link.linked_recipe_id}`)}
                      >
                        <Text style={styles.linkType}>{link.link_type.toUpperCase()}</Text>
                        <Text style={styles.linkTitle}>{link.linked_recipe?.title}</Text>
                        {link.note && <Text style={styles.linkNote}>{link.note}</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveLink(link.id)} style={styles.linkRemove}>
                        <Text style={{ color: '#EF4444' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View>
              {recipe.made_history && recipe.made_history.length > 0 ? (
                recipe.made_history.map(entry => (
                  <View key={entry.id} style={styles.historyEntry}>
                    <Text style={styles.historyDate}>✓ {formatDate(entry.made_at)}</Text>
                    <Text style={styles.historyAgo}>{timeAgo(entry.made_at)}</Text>
                    {entry.servings && <Text style={styles.historyMeta}>Servings: {entry.servings}</Text>}
                    {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Not cooked yet. Press "Made it!" to log it.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Made it modal */}
      <Modal visible={showMadeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Cooking Session</Text>
            <View style={styles.modalServingsRow}>
              <Text style={styles.modalLabel}>Servings made:</Text>
              <ServingsControl servings={madeServings} onChange={setMadeServings} />
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Notes (optional)…"
              multiline
              numberOfLines={3}
              value={madeNotes}
              onChangeText={setMadeNotes}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMadeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleMarkMade}>
                <Text style={styles.modalConfirmText}>Log ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 250 },
  heroPlaceholder: { height: 160, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 64 },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 12, lineHeight: 32 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtnPrimary: { backgroundColor: '#10B981', borderColor: '#10B981' },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  metaGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  metaItem: { alignItems: 'center', flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10 },
  metaValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  metaLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  lastMade: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  servingsRow: { marginBottom: 16 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, marginHorizontal: -3 },
  sourceLink: { fontSize: 13, color: '#10B981', textDecorationLine: 'underline', marginTop: 4 },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#10B981' },
  tabText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  tabTextActive: { color: '#10B981' },
  tabContent: { padding: 20, backgroundColor: '#fff', margin: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  notesText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  linkCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  linkType: { fontSize: 10, fontWeight: '700', color: '#10B981', letterSpacing: 0.8, marginBottom: 4 },
  linkTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  linkNote: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  linkRemove: { padding: 12 },
  historyEntry: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#111827' },
  historyAgo: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyNotes: { fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  modalServingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirm: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
