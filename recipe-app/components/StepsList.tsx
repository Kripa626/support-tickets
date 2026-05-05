import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Step } from '../lib/types';

interface Props {
  steps: Step[];
}

export function StepsList({ steps }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View>
      {steps.map((step, i) => {
        const done = completed.has(step.id);
        return (
          <TouchableOpacity
            key={step.id}
            style={[styles.step, done && styles.stepDone]}
            onPress={() => toggle(step.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.number, done && styles.numberDone]}>
              <Text style={[styles.numberText, done && styles.numberTextDone]}>
                {done ? '✓' : i + 1}
              </Text>
            </View>
            <View style={styles.content}>
              <Text style={[styles.desc, done && styles.descDone]}>{step.description}</Text>
              {step.tip && <Text style={styles.tip}>💡 {step.tip}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepDone: { opacity: 0.5 },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  numberDone: { backgroundColor: '#6B7280' },
  numberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  numberTextDone: {},
  content: { flex: 1 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22 },
  descDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  tip: { fontSize: 13, color: '#F59E0B', marginTop: 6, fontStyle: 'italic' },
});
