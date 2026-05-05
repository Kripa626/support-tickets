import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { v4 as uuid } from 'uuid';
import { useRecipeStore } from '../../store/useRecipeStore';
import { getOrCreateTag } from '../../lib/db/tags';
import { addRecipeLink } from '../../lib/db/recipes';
import { Tag, Ingredient, Step } from '../../lib/types';
import { TagChip } from '../../components/TagChip';
import { RatingStars } from '../../components/RatingStars';

export default function NewRecipeScreen() {
  return <RecipeForm />;
}

export function RecipeForm({
  initial,
  onSave,
}: {
  initial?: Partial<{
    title: string; description: string; servings: number; prep_time: number; cook_time: number;
    rating: number | null; is_favourite: boolean; is_starred: boolean; notes: string;
    source_url: string; ingredients: Ingredient[]; steps: Step[]; tags: Tag[];
    image_url: string;
  }>;
  onSave?: (data: any) => Promise<void>;
}) {
  const { addRecipe } = useRecipeStore();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [servings, setServings] = useState(String(initial?.servings ?? 4));
  const [prepTime, setPrepTime] = useState(String(initial?.prep_time ?? ''));
  const [cookTime, setCookTime] = useState(String(initial?.cook_time ?? ''));
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [isFav, setIsFav] = useState(initial?.is_favourite ?? false);
  const [isStarred, setIsStarred] = useState(initial?.is_starred ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? [{ id: uuid(), recipe_id: '', name: '', amount: null, unit: null, group_name: null, order_index: 0 }]
  );
  const [steps, setSteps] = useState<Step[]>(
    initial?.steps ?? [{ id: uuid(), recipe_id: '', order_index: 0, description: '', tip: null }]
  );
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addIngredient = () => {
    setIngredients(prev => [...prev, { id: uuid(), recipe_id: '', name: '', amount: null, unit: null, group_name: null, order_index: prev.length }]);
  };

  const updateIngredient = (id: string, field: string, value: any) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value || null } : i));
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { id: uuid(), recipe_id: '', order_index: prev.length, description: '', tip: null }]);
  };

  const updateStep = (id: string, field: string, value: any) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value || null } : s));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const addTag = async () => {
    const name = tagInput.trim();
    if (!name || tags.some(t => t.name === name.toLowerCase())) return;
    const tag = await getOrCreateTag(name);
    setTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const removeTag = (id: string) => setTags(prev => prev.filter(t => t.id !== id));

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Recipe title is required'); return; }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        source_url: sourceUrl.trim() || null,
        source_type: 'manual' as const,
        image_url: imageUrl.trim() || null,
        servings: parseInt(servings) || 4,
        prep_time: parseInt(prepTime) || null,
        cook_time: parseInt(cookTime) || null,
        rating,
        is_favourite: isFav,
        is_starred: isStarred,
        notes: notes.trim() || null,
        ingredients: ingredients.filter(i => i.name.trim()),
        steps: steps.filter(s => s.description.trim()),
        tags,
      };

      if (onSave) {
        await onSave(data);
      } else {
        await addRecipe(data);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Basic Info">
          <Field label="Title *">
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recipe name" />
          </Field>
          <Field label="Description">
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
              placeholder="Brief description…" multiline numberOfLines={3} />
          </Field>
          <Field label="Image URL">
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl}
              placeholder="https://…" autoCapitalize="none" keyboardType="url" />
          </Field>
          <Field label="Source URL">
            <TextInput style={styles.input} value={sourceUrl} onChangeText={setSourceUrl}
              placeholder="https://…" autoCapitalize="none" keyboardType="url" />
          </Field>
        </Section>

        <Section title="Time & Servings">
          <View style={styles.row3}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Servings</Text>
              <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Prep (min)</Text>
              <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Cook (min)</Text>
              <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} keyboardType="numeric" />
            </View>
          </View>
        </Section>

        <Section title="Rating & Flags">
          <RatingStars rating={rating} onRate={r => setRating(r === rating ? null : r)} size={32} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Favourite ❤️</Text>
            <Switch value={isFav} onValueChange={setIsFav} trackColor={{ true: '#10B981' }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Starred ⭐</Text>
            <Switch value={isStarred} onValueChange={setIsStarred} trackColor={{ true: '#10B981' }} />
          </View>
        </Section>

        <Section title="Tags">
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add tag…"
              onSubmitEditing={addTag}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTag}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagRow}>
            {tags.map(tag => (
              <TagChip key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
            ))}
          </View>
        </Section>

        <Section title="Ingredients">
          {ingredients.map((ing, idx) => (
            <View key={ing.id} style={styles.ingRow}>
              <TextInput
                style={[styles.input, { flex: 0.4 }]}
                placeholder="Amount"
                value={ing.amount != null ? String(ing.amount) : ''}
                onChangeText={v => updateIngredient(ing.id, 'amount', v ? parseFloat(v) : null)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { flex: 0.3 }]}
                placeholder="Unit"
                value={ing.unit ?? ''}
                onChangeText={v => updateIngredient(ing.id, 'unit', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ingredient *"
                value={ing.name}
                onChangeText={v => updateIngredient(ing.id, 'name', v)}
              />
              <TouchableOpacity onPress={() => removeIngredient(ing.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addItemBtn} onPress={addIngredient}>
            <Text style={styles.addItemBtnText}>＋ Add ingredient</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Steps">
          {steps.map((step, idx) => (
            <View key={step.id} style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{idx + 1}</Text></View>
                <TouchableOpacity onPress={() => removeStep(step.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Describe this step…"
                value={step.description}
                onChangeText={v => updateStep(step.id, 'description', v)}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Tip (optional)"
                value={step.tip ?? ''}
                onChangeText={v => updateStep(step.id, 'tip', v)}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addItemBtn} onPress={addStep}>
            <Text style={styles.addItemBtnText}>＋ Add step</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Notes">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Personal notes, tips, variations, linked recipes…"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
          />
        </Section>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : '✓ Save Recipe'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 60 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row3: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  tagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  ingRow: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
  removeBtn: { padding: 8 },
  removeBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  addItemBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#10B981', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  addItemBtnText: { color: '#10B981', fontWeight: '600', fontSize: 14 },
  stepBlock: { marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
