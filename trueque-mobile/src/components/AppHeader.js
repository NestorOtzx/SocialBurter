import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function AppHeader({
  title,
  fontSize = 18,
  navigation = null,
  showBack = false,
  showLogout = false,
  rightContent = null,
}) {
  const signOut = useAuthStore((state) => state.signOut);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Alert no funciona bien en web, confirmamos directamente
      if (window.confirm('¿Deseas cerrar sesión?')) {
        signOut();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Lado izquierdo: botón volver */}
        <View style={styles.side}>
          {showBack && navigation ? (
            <Pressable onPress={handleBack} style={styles.iconButton} hitSlop={8}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <Text style={[styles.title, { fontSize }]} numberOfLines={1}>{title}</Text>

        {/* Lado derecho: cerrar sesión o contenido custom */}
        <View style={styles.side}>
          {showLogout ? (
            <Pressable onPress={handleLogout} style={styles.iconButton} hitSlop={8}>
              <Feather name="log-out" size={20} color="#FFFFFF" />
            </Pressable>
          ) : rightContent ? (
            rightContent
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
      <View style={styles.accentStripe} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
  },
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  accentStripe: {
    height: 4,
    backgroundColor: colors.accent,
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 6,
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
});
