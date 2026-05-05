import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tag } from '../lib/types';

interface Props {
  tag: Tag;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function TagChip({ tag, selected, onPress, onRemove, size = 'md' }: Props) {
  const color = tag.color ?? '#6B7280';
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? color : `${color}22`, borderColor: color },
        isSmall && styles.chipSmall,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: selected ? '#fff' : color }, isSmall && styles.textSmall]}>
        {tag.name}
        {onRemove ? '  ×' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    margin: 3,
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    margin: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 11,
  },
});
