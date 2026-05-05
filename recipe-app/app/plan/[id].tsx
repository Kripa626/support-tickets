import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, FlatList, Alert, SectionList,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { addPlanItem, removePlanItem } from '../../lib/db/plans';
import { generateFromPlan } from '../../lib/db/shopping';
import { MealPlanItem } from '../../lib/types';
import { formatDate } from '../../lib/utils';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;
const MEAL_EMOJIS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', dessert: '🍰' };

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedPlan, loadPlan, recipes, loadRecipes, loadShoppingLists } = useRecipeStore();
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addMealType, setAddMealType] = useState<string>('dinner');
  const [addServings, setAddServings] = useState(4);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (id) loadPlan(id);
  }, [id, refreshKey]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleAddItem = async () => {
    if (!selectedRecipeId || !id) return;
    await addPlanItem(id, selectedRecipeId, addDate, addMealType, addServings);
    setShowAdd(false);
    setSelectedRecipeId(null);
    setRefreshKey(k => k + 1);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removePlanItem(itemId);
    setRefreshKey(k => k + 1);
  };

  const handleGenerateShopping = async () => {
    if (!id || !selectedPlan) return;
    try {
      await generateFromPlan(id, `Shopping: ${selectedPlan.name}`);
      await loadShoppingLists();
      Alert.alert('Done!', 'Shopping list generated and saved.', [
        { text: 'View Shopping', onPress: () => router.push('/(tabs)/shopping') },
        { text: 'Stay here', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!selectedPlan) return <View style={styles.center}><Text>Loading…</Text></View>;

  const itemsByDate = new Map<string, MealPlanItem[]>();
  for (const item of selectedPlan.items ?? []) {
    if (!itemsByDate.has(item.planned_date)) itemsByDate.set(item.planned_date, []);
    itemsByDate.get(item.planned_date)!.push(item);
  }
  const dates = Array.from(itemsByDate.keys()).sort();

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedPlan.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleGenerateShopping} style={{ paddingRight: 4 }}>
              <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 15 }}>🛒 Shopping List</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {dates.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No meals added yet. Tap ＋ to add recipes.</Text>
          </View>
        )}

        {dates.map(date => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{formatDate(date)}</Text>
            {(itemsByDate.get(date) ?? []).map(item => (
              <View key={item.id} style={styles.mealRow}>
                <Text style={styles.mealEmoji}>{MEAL_EMOJIS[item.meal_type] ?? '🍽️'}</Text>
                <TouchableOpacity
                  style={styles.mealCard}
                  onPress={() => router.push(`/recipe/${item.recipe_id}`)}
                >
                  <Text style={styles.mealType}>{item.meal_type.toUpperCase()}</Text>
                  <Text style={styles.mealTitle}>{(item as any).recipe_title ?? 'Recipe'}</Text>
                  <Text style={styles.mealMeta}>👥 {item.servings} servings</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Add meal modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to Plan</Text>

            <Text style={styles.modalLabel}>Date</Text>
            <Text style={styles.dateDisplay}>{formatDate(addDate)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {Array.from({ length: 14 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const iso = d.toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={iso}
                    style={[styles.datePill, addDate === iso && styles.datePillActive]}
                    onPress={() => setAddDate(iso)}
                  >
                    <Text style={[styles.datePillText, addDate === iso && styles.datePillTextActive]}>
                      {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.modalLabel}>Meal type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {MEAL_TYPES.map(mt => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.mealTypePill, addMealType === mt && styles.mealTypePillActive]}
                  onPress={() => setAddMealType(mt)}
                >
                  <Text style={styles.mealTypePillText}>{MEAL_EMOJIS[mt]} {mt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Recipe</Text>
            <ScrollView style={styles.recipeList} showsVerticalScrollIndicator>
              {recipes.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.recipeRow, selectedRecipeId === r.id && styles.recipeRowActive]}
                  onPress={() => setSelectedRecipeId(r.id)}
                >
                  <Text style={styles.recipeRowText} numberOfLines={1}>{r.title}</Text>
                  {selectedRecipeId === r.id && <Text style={{ color: '#10B981' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !selectedRecipeId && styles.modalConfirmDisabled]}
                onPress={handleAddItem}
                disabled={!selectedRecipeId}
              >
                <Text style={styles.modalConfirmText}>Add to Plan</Text>
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
  content: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  dateGroup: { marginBottom: 16 },
  dateHeader: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8, paddingLeft: 4 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mealEmoji: { fontSize: 24, marginRight: 8 },
  mealCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  mealType: { fontSize: 10, fontWeight: '700', color: '#10B981', letterSpacing: 0.8, marginBottom: 3 },
  mealTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  mealMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  removeBtn: { padding: 12 },
  removeBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateDisplay: { fontSize: 15, color: '#111827', fontWeight: '600', marginBottom: 8 },
  dateScroll: { marginBottom: 16 },
  datePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  datePillActive: { backgroundColor: '#10B981' },
  datePillText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  datePillTextActive: { color: '#fff' },
  mealTypePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  mealTypePillActive: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  mealTypePillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  recipeList: { maxHeight: 200, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
  recipeRow: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recipeRowActive: { backgroundColor: '#F0FDF4' },
  recipeRowText: { fontSize: 14, color: '#374151', flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirm: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmDisabled: { opacity: 0.4 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
