import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../constants/theme';

export default function Chip({ label, selected, onPress, compact = false, small = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, compact && styles.compact, small && styles.smallChip, selected && styles.selectedChip]}
    >
      <Text style={[styles.label, small && styles.smallLabel, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chipBackground,
    marginRight: 8,
    marginBottom: 10,
  },
  compact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.mutedText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  smallLabel: {
    fontSize: 11,
  },
  selectedLabel: {
    color: colors.background,
  },
});
