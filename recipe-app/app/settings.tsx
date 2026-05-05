import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking,
} from 'react-native';
import { getApiKey, saveApiKey, clearApiKey } from '../lib/claude';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [masked, setMasked] = useState(true);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    getApiKey().then(key => {
      if (key) { setHasKey(true); setApiKey(key); }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert('Invalid Key', 'Anthropic API keys start with "sk-ant-". Please check your key.');
      return;
    }
    await saveApiKey(trimmed);
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    Alert.alert('Remove API Key', 'This will disable AI recipe import.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await clearApiKey();
          setApiKey('');
          setHasKey(false);
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claude AI Setup</Text>
        <Text style={styles.sectionDesc}>
          Recipebook uses Claude to intelligently extract recipes from URLs, Instagram links,
          pasted text, and photos. You need an Anthropic API key to use this feature.
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/account/keys')}>
          <Text style={styles.link}>Get your API key from console.anthropic.com →</Text>
        </TouchableOpacity>

        {hasKey && (
          <View style={styles.keyStatus}>
            <Text style={styles.keyStatusIcon}>✓</Text>
            <Text style={styles.keyStatusText}>API key configured</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Anthropic API Key</Text>
        <View style={styles.keyRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-ant-api03-…"
            secureTextEntry={masked}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setMasked(m => !m)} style={styles.eyeBtn}>
            <Text style={styles.eyeBtnText}>{masked ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Key'}</Text>
          </TouchableOpacity>
          {hasKey && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.privacy}>
          🔒 Your API key is stored securely on your device only and never sent to any server other than Anthropic.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported Sources</Text>
        {[
          ['🔗', 'Recipe websites', 'Any recipe blog, food site, or news article'],
          ['📸', 'Instagram', 'Paste an Instagram post URL (instagram.com/p/…)'],
          ['📋', 'Any text', 'Copy-paste from any app, message, or document'],
          ['📷', 'Photos', 'Take a photo of a recipe card or screenshot'],
        ].map(([emoji, title, desc]) => (
          <View key={title} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Recipebook v1.0.0</Text>
        <Text style={styles.aboutText}>Built with Expo + Claude AI</Text>
        <Text style={styles.aboutText}>Powered by claude-sonnet-4-6</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 60 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  sectionDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  link: { fontSize: 14, color: '#10B981', textDecorationLine: 'underline', marginBottom: 16 },
  keyStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, marginBottom: 12 },
  keyStatusIcon: { fontSize: 16, color: '#10B981' },
  keyStatusText: { fontSize: 14, fontWeight: '600', color: '#065F46' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  keyRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  eyeBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  eyeBtnText: { fontSize: 20 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  saveBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnSuccess: { backgroundColor: '#059669' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearBtn: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
  clearBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 14 },
  privacy: { fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
  featureRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  featureEmoji: { fontSize: 22, marginTop: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: '#6B7280' },
  aboutText: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
});
