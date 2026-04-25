import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, shadow } from '../constants/theme';

export default function MenuCard({ icon, title, description, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    minHeight: 180,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.background,
    marginBottom: 18,
    ...shadow,
  },
  iconBox: {
    marginBottom: 18,
  },
  title: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
});
