import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  rating: number | null;
  maxStars?: number;
  size?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export function RatingStars({ rating, maxStars = 5, size = 24, onRate, readonly = false }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = rating != null && i < rating;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => !readonly && onRate?.(i + 1)}
            disabled={readonly}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={{ fontSize: size, color: filled ? '#F59E0B' : '#D1D5DB' }}>
              {filled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
