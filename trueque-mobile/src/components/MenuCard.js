import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '../constants/theme';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function MenuCard({ icon, title, description, onPress, accentColor }) {
  const accent = accentColor || colors.primary;
  const bgTint = hexToRgba(accent, 0.07);
  const iconBg = hexToRgba(accent, 0.13);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderTopColor: accent, backgroundColor: pressed ? hexToRgba(accent, 0.12) : colors.background }]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.arrow, { backgroundColor: hexToRgba(accent, 0.10) }]}>
        <Feather name="chevron-right" size={16} color={accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: 18,
    borderTopWidth: 4,
    padding: 18,
    backgroundColor: colors.background,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'space-between',
    minHeight: 190,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  textBlock: {
    flex: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 11.5,
    color: colors.mutedText,
    lineHeight: 17,
    fontFamily: fonts.regular,
  },
  arrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
