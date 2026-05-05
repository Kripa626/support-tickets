import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ingredient } from '../lib/types';
import { formatAmount, groupIngredientsByGroup, scaleIngredients } from '../lib/utils';

interface Props {
  ingredients: Ingredient[];
  originalServings: number;
  currentServings: number;
}

export function IngredientsList({ ingredients, originalServings, currentServings }: Props) {
  const scaled = scaleIngredients(ingredients, originalServings, currentServings);
  const groups = groupIngredientsByGroup(scaled);

  return (
    <View>
      {Array.from(groups.entries()).map(([group, items]) => (
        <View key={group} style={styles.group}>
          {group !== '' && <Text style={styles.groupHeader}>{group}</Text>}
          {items.map(ing => (
            <View key={ing.id} style={styles.row}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.ingredient}>
                <Text style={styles.amount}>{formatAmount(ing.amount, ing.unit)} </Text>
                {ing.name}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 12 },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  row: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  bullet: { color: '#10B981', fontWeight: '700', marginRight: 8, marginTop: 1 },
  ingredient: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },
  amount: { fontWeight: '600', color: '#111827' },
});
