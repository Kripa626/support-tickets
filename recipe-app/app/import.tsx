import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { v4 as uuid } from 'uuid';
import { getApiKey, parseRecipeFromUrl, parseRecipeFromText, parseRecipeFromImage } from '../lib/claude';
import { getOrCreateTag } from '../lib/db/tags';
import { useRecipeStore } from '../store/useRecipeStore';
import { ParsedRecipe, Ingredient, Step, Tag } from '../lib/types';

type ImportMode = 'url' | 'text' | 'image';

export default function ImportScreen() {
  const { addRecipe } = useRecipeStore();
  const [mode, setMode] = useState<ImportMode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      const ext = asset.uri.split('.').pop()?.toLowerCase();
      setImageMime(ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
    }
  };

  const handleParse = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert('API Key Required', 'Please add your Anthropic API key in Settings first.', [
        { text: 'Go to Settings', onPress: () => router.push('/settings') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    setParsing(true);
    setError(null);
    setParsed(null);

    try {
      let result: ParsedRecipe;
      if (mode === 'url') {
        if (!url.trim()) { setError('Enter a URL first'); setParsing(false); return; }
        result = await parseRecipeFromUrl(url.trim(), apiKey);
      } else if (mode === 'text') {
        if (!text.trim()) { setError('Paste recipe text first'); setParsing(false); return; }
        result = await parseRecipeFromText(text.trim(), apiKey);
      } else {
        if (!imageBase64) { setError('Select an image first'); setParsing(false); return; }
        result = await parseRecipeFromImage(imageBase64, imageMime, apiKey);
      }
      setParsed(result);
    } catch (e: any) {
      setError(e.message ?? 'Failed to parse recipe');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const tags: Tag[] = [];
      for (const tagName of parsed.tags ?? []) {
        tags.push(await getOrCreateTag(tagName));
      }

      const ingredients: Ingredient[] = (parsed.ingredients ?? []).map((ing, i) => ({
        id: uuid(),
        recipe_id: '',
        name: ing.name,
        amount: ing.amount ?? null,
        unit: ing.unit ?? null,
        group_name: ing.group ?? null,
        order_index: i,
      }));

      const steps: Step[] = (parsed.steps ?? []).map((s, i) => ({
        id: uuid(),
        recipe_id: '',
        order_index: i,
        description: s.description,
        tip: s.tip ?? null,
      }));

      const recipe = await addRecipe({
        title: parsed.title,
        description: parsed.description ?? null,
        source_url: mode === 'url' ? url.trim() : (parsed.source_url ?? null),
        source_type: mode === 'url' ? (url.includes('instagram.com') ? 'instagram' : 'url') : mode === 'image' ? 'app' : 'manual',
        image_url: null,
        servings: parsed.servings ?? 4,
        prep_time: parsed.prep_time ?? null,
        cook_time: parsed.cook_time ?? null,
        rating: null,
        is_favourite: false,
        is_starred: false,
        notes: null,
        ingredients,
        steps,
        tags,
      });

      router.replace(`/recipe/${recipe.id}`);
    } catch (e: any) {
      Alert.alert('Error saving recipe', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.headline}>Import Recipe with AI</Text>
        <Text style={styles.sub}>Claude will extract the recipe automatically from a URL, pasted text, or a photo.</Text>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {([['url', '🔗 URL / Instagram'], ['text', '📋 Paste Text'], ['image', '📷 Photo']] as [ImportMode, string][]).map(([m, label]) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => { setMode(m); setParsed(null); setError(null); }}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'url' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Recipe URL or Instagram link</Text>
            <View style={styles.urlRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="https://…"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity style={styles.pasteBtn} onPress={pasteFromClipboard}>
                <Text style={styles.pasteBtnText}>Paste</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Works with recipe websites, food blogs, and Instagram posts. For Instagram, paste the post URL.</Text>
          </View>
        )}

        {mode === 'text' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Paste recipe text</Text>
            <TextInput
              style={[styles.input, styles.bigInput]}
              placeholder="Paste recipe content from any app, message, or website…"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        )}

        {mode === 'image' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Recipe photo or screenshot</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Text style={styles.imagePickerDone}>✓ Image selected — tap to change</Text>
              ) : (
                <Text style={styles.imagePickerText}>📷 Tap to choose image</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.parseBtn, parsing && styles.parseBtnDisabled]}
          onPress={handleParse}
          disabled={parsing}
        >
          {parsing ? (
            <View style={styles.parseRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.parseBtnText}> Extracting recipe…</Text>
            </View>
          ) : (
            <Text style={styles.parseBtnText}>✨ Extract Recipe with Claude</Text>
          )}
        </TouchableOpacity>

        {/* Parsed preview */}
        {parsed && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>✓ Recipe extracted!</Text>
            <Text style={styles.previewName}>{parsed.title}</Text>

            {parsed.description && <Text style={styles.previewDesc}>{parsed.description}</Text>}

            <View style={styles.previewMeta}>
              {parsed.servings && <Text style={styles.previewMetaItem}>👥 {parsed.servings} servings</Text>}
              {parsed.prep_time && <Text style={styles.previewMetaItem}>⏱ {parsed.prep_time}min prep</Text>}
              {parsed.cook_time && <Text style={styles.previewMetaItem}>🔥 {parsed.cook_time}min cook</Text>}
            </View>

            <Text style={styles.previewSection}>Ingredients ({parsed.ingredients.length})</Text>
            {parsed.ingredients.slice(0, 5).map((ing, i) => (
              <Text key={i} style={styles.previewItem}>• {ing.amount ? `${ing.amount} ${ing.unit ?? ''} ` : ''}{ing.name}</Text>
            ))}
            {parsed.ingredients.length > 5 && <Text style={styles.previewMore}>+{parsed.ingredients.length - 5} more…</Text>}

            <Text style={styles.previewSection}>Steps ({parsed.steps.length})</Text>
            {parsed.steps.slice(0, 3).map((s, i) => (
              <Text key={i} style={styles.previewItem} numberOfLines={2}>{i + 1}. {s.description}</Text>
            ))}
            {parsed.steps.length > 3 && <Text style={styles.previewMore}>+{parsed.steps.length - 3} more…</Text>}

            {parsed.tags && parsed.tags.length > 0 && (
              <Text style={styles.previewTags}>Tags: {parsed.tags.join(', ')}</Text>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : '✓ Save to My Recipes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryBtn} onPress={() => setParsed(null)}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 60 },
  headline: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  modeBtnTextActive: { color: '#065F46' },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  urlRow: { flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  bigInput: { minHeight: 160, textAlignVertical: 'top' },
  pasteBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  pasteBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 8, lineHeight: 18 },
  imagePicker: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 12, padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB' },
  imagePickerText: { fontSize: 15, color: '#9CA3AF' },
  imagePickerDone: { fontSize: 15, color: '#10B981', fontWeight: '600' },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 14, lineHeight: 20 },
  parseBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  parseBtnDisabled: { opacity: 0.6 },
  parseRow: { flexDirection: 'row', alignItems: 'center' },
  parseBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  previewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#D1FAE5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 8 },
  previewName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  previewDesc: { fontSize: 14, color: '#6B7280', marginBottom: 12, lineHeight: 20 },
  previewMeta: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  previewMetaItem: { fontSize: 13, color: '#374151', fontWeight: '600' },
  previewSection: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 6 },
  previewItem: { fontSize: 13, color: '#6B7280', marginBottom: 3, lineHeight: 18 },
  previewMore: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },
  previewTags: { fontSize: 13, color: '#6B7280', marginTop: 12, fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  retryBtn: { alignItems: 'center', padding: 12, marginTop: 8 },
  retryBtnText: { color: '#6B7280', fontSize: 14, textDecorationLine: 'underline' },
});
