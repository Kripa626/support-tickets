import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { formatDate, timeAgo } from '../../lib/utils';
import { MealPlan } from '../../lib/types';
import { addPlanItem, removePlanItem, getPlanItems } from '../../lib/db/plans';
import { generateFromPlan } from '../../lib/db/shopping';

export default function PlansScreen() {
  const { plans, loadPlans, addPlan, removePlan, loadShoppingLists } = useRecipeStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await addPlan(newName.trim());
    setNewName('');
    setShowNew(false);
    setCreating(false);
  };

  const handleDelete = (plan: MealPlan) => {
    Alert.alert('Delete Plan', `Delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removePlan(plan.id) },
    ]);
  };

  const handleGenerateShopping = async (plan: MealPlan) => {
    try {
      await generateFromPlan(plan.id, `Shopping: ${plan.name}`);
      await loadShoppingLists();
      Alert.alert('Done', 'Shopping list generated! Check the Shopping tab.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/plan/${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleGenerateShopping(item)} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>🛒</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardMeta}>Created {timeAgo(item.created_at)}</Text>
            {item.start_date && (
              <Text style={styles.cardMeta}>
                {formatDate(item.start_date)}
                {item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
              </Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={plans.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No meal plans yet</Text>
            <Text style={styles.emptySub}>Create a plan to organise your week and auto-generate shopping lists.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowNew(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={showNew} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Meal Plan</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Plan name (e.g. Week 20, Holiday menu)"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowNew(false); setNewName(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate} disabled={creating}>
                <Text style={styles.modalConfirmText}>{creating ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginVertical: 8, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  actionBtnText: { fontSize: 20 },
  cardMeta: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyContainer: { flexGrow: 1 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirm: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
