import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../constants/theme';

export default function AppHeader({ title, fontSize = 18, showDivider = true, rightContent = null }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.container, showDivider && styles.divider]}>
        <View style={styles.side}>{rightContent ? null : <View style={styles.placeholder} />}</View>
        <Text style={[styles.title, { fontSize }]}>{title}</Text>
        <View style={styles.side}>{rightContent || <View style={styles.placeholder} />}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    width: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.bold,
  },
});
