import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, SectionList,
} from 'react-native';
import { useRecipeStore } from '../../store/useRecipeStore';
import { toggleShoppingItem, deleteShoppingItem, addShoppingItem, createShoppingList } from '../../lib/db/shopping';
import { ShoppingListItem, ShoppingList } from '../../lib/types';
import { timeAgo } from '../../lib/utils';

export default function ShoppingScreen() {
  const { shoppingLists, loadShoppingLists, selectedShoppingList, loadShoppingList, removeShoppingList } = useRecipeStore();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { loadShoppingLists(); }, [refreshKey]);

  useEffect(() => {
    if (activeListId) {
      loadShoppingList(activeListId);
    }
  }, [activeListId, refreshKey]);

  useEffect(() => {
    if (selectedShoppingList) setItems(selectedShoppingList.items ?? []);
  }, [selectedShoppingList]);

  useEffect(() => {
    if (shoppingLists.length > 0 && !activeListId) setActiveListId(shoppingLists[0].id);
  }, [shoppingLists]);

  const handleToggle = async (item: ShoppingListItem) => {
    await toggleShoppingItem(item.id, !item.is_checked);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteShoppingItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !activeListId) return;
    const item = await addShoppingItem(
      activeListId,
      newItemName.trim(),
      newItemAmount ? parseFloat(newItemAmount) : undefined,
      newItemUnit || undefined,
    );
    setItems(prev => [...prev, item]);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemUnit('');
    setShowAddItem(false);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const list = await createShoppingList(newListName.trim());
    setNewListName('');
    setShowNewList(false);
    setRefreshKey(k => k + 1);
    setActiveListId(list.id);
  };

  const handleDeleteList = (list: ShoppingList) => {
    Alert.alert('Delete List', `Delete "${list.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await removeShoppingList(list.id);
          if (activeListId === list.id) setActiveListId(null);
          setRefreshKey(k => k + 1);
        }
      },
    ]);
  };

  // Group items by category
  const grouped = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }
  const sections = Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));

  const unchecked = items.filter(i => !i.is_checked).length;
  const total = items.length;

  return (
    <View style={styles.container}>
      {/* List selector */}
      {shoppingLists.length > 0 && (
        <View style={styles.listSelector}>
          <FlatList
            data={shoppingLists}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={l => l.id}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listTab, activeListId === item.id && styles.listTabActive]}
                onPress={() => setActiveListId(item.id)}
                onLongPress={() => handleDeleteList(item)}
              >
                <Text style={[styles.listTabText, activeListId === item.id && styles.listTabTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Progress */}
      {items.length > 0 && (
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((total - unchecked) / total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{total - unchecked}/{total} checked</Text>
        </View>
      )}

      {/* Items */}
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={i => i.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemRow, item.is_checked && styles.itemRowChecked]}
              onPress={() => handleToggle(item)}
            >
              <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}>
                  {item.amount ? `${item.amount} ${item.unit ?? ''}  ` : ''}{item.ingredient_name}
                </Text>
                {item.recipe_title && <Text style={styles.itemRecipe}>{item.recipe_title}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>
            {shoppingLists.length === 0 ? 'No shopping lists' : 'List is empty'}
          </Text>
          <Text style={styles.emptySub}>
            {shoppingLists.length === 0
              ? 'Create a meal plan and generate a list, or start one manually.'
              : 'Tap ＋ to add items manually.'}
          </Text>
        </View>
      )}

      {/* FABs */}
      <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => setShowNewList(true)}>
        <Text style={styles.fabText}>📋</Text>
      </TouchableOpacity>
      {activeListId && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddItem(true)}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      {/* New list modal */}
      <Modal visible={showNewList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Shopping List</Text>
            <TextInput style={styles.modalInput} placeholder="List name…" value={newListName} onChangeText={setNewListName} autoFocus onSubmitEditing={handleCreateList} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNewList(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreateList}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add item modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <View style={styles.addItemRow}>
              <TextInput style={[styles.modalInput, { flex: 0.3 }]} placeholder="Qty" value={newItemAmount} onChangeText={setNewItemAmount} keyboardType="decimal-pad" />
              <TextInput style={[styles.modalInput, { flex: 0.3 }]} placeholder="Unit" value={newItemUnit} onChangeText={setNewItemUnit} />
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Item name *" value={newItemName} onChangeText={setNewItemName} autoFocus onSubmitEditing={handleAddItem} />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddItem(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddItem}>
                <Text style={styles.modalConfirmText}>Add</Text>
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
  listSelector: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  listTabActive: { backgroundColor: '#10B981' },
  listTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  listTabTextActive: { color: '#fff' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#6B7280', fontWeight: '600', minWidth: 60 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F9FAFB' },
  listContent: { paddingBottom: 100 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemRowChecked: { backgroundColor: '#F9FAFB' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  itemRecipe: { fontSize: 11, color: '#10B981', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#D1D5DB', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  fabSecondary: { right: 84, backgroundColor: '#6B7280' },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  addItemRow: { flexDirection: 'row', gap: 8 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirm: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
