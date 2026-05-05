import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { deleteTag, updateTagColor } from '../../lib/db/tags';
import { Tag } from '../../lib/types';

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

export default function TagsScreen() {
  const { tags, loadTags, setFilter } = useRecipeStore();
  const [editTag, setEditTag] = useState<(Tag & { count: number }) | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { loadTags(); }, [refreshKey]);

  const handleDelete = (tag: Tag & { count: number }) => {
    Alert.alert(
      'Delete Tag',
      `Delete "${tag.name}"? It will be removed from ${tag.count} recipe${tag.count !== 1 ? 's' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await deleteTag(tag.id);
            setRefreshKey(k => k + 1);
          }
        },
      ]
    );
  };

  const handleColorChange = async (color: string) => {
    if (!editTag) return;
    await updateTagColor(editTag.id, color);
    setEditTag(null);
    setRefreshKey(k => k + 1);
  };

  const browseByTag = (tag: Tag) => {
    setFilter('tag', tag.name);
    router.push('/(tabs)/');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tags}
        keyExtractor={t => t.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.hint}>Tap a tag to browse recipes. Long-press to edit or delete.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tagCard, { borderColor: item.color ?? '#10B981' }]}
            onPress={() => browseByTag(item)}
            onLongPress={() => setEditTag(item)}
          >
            <View style={[styles.tagDot, { backgroundColor: item.color ?? '#10B981' }]} />
            <Text style={styles.tagName}>{item.name}</Text>
            <Text style={styles.tagCount}>{item.count} recipe{item.count !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏷️</Text>
            <Text style={styles.emptyTitle}>No tags yet</Text>
            <Text style={styles.emptySub}>Tags are added when you create or import recipes. They help you find recipes by cuisine, diet type, or occasion.</Text>
          </View>
        }
      />

      {/* Edit color modal */}
      <Modal visible={!!editTag} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit "{editTag?.name}"</Text>
            <Text style={styles.modalLabel}>Choose color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, editTag?.color === c && styles.colorDotSelected]}
                  onPress={() => handleColorChange(c)}
                />
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.deleteTagBtn}
                onPress={() => { setEditTag(null); editTag && handleDelete(editTag); }}
              >
                <Text style={styles.deleteTagBtnText}>Delete tag</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditTag(null)}>
                <Text style={styles.modalCancelText}>Close</Text>
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
  listContent: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, color: '#9CA3AF', marginBottom: 16, textAlign: 'center' },
  row: { gap: 12, marginBottom: 12 },
  tagCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 2, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  tagDot: { width: 16, height: 16, borderRadius: 8, marginBottom: 8 },
  tagName: { fontSize: 16, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 4 },
  tagCount: { fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, margin: 32, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorDotSelected: { borderWidth: 3, borderColor: '#111827', transform: [{ scale: 1.1 }] },
  modalBtns: { flexDirection: 'row', gap: 12 },
  deleteTagBtn: { flex: 1, borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#FEF2F2' },
  deleteTagBtnText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});
