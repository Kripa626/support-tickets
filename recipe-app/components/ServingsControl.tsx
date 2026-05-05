import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  servings: number;
  onChange: (servings: number) => void;
  min?: number;
  max?: number;
}

export function ServingsControl({ servings, onChange, min = 1, max = 100 }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, servings <= min && styles.btnDisabled]}
        onPress={() => onChange(Math.max(min, servings - 1))}
        disabled={servings <= min}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.count}>{servings}</Text>
      <TouchableOpacity
        style={[styles.btn, servings >= max && styles.btnDisabled]}
        onPress={() => onChange(Math.min(max, servings + 1))}
        disabled={servings >= max}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
      <Text style={styles.label}>servings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnText: { color: '#fff', fontSize: 22, lineHeight: 24, fontWeight: '700' },
  count: { fontSize: 22, fontWeight: '700', color: '#111827', minWidth: 36, textAlign: 'center' },
  label: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
});
