import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import InputField from './InputField';
import { colors, fonts, spacing, shadow } from '../constants/theme';
import { loginRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function OfflineLoginModal({ visible }) {
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Validación', 'Usuario y contraseña son obligatorios.');
      return;
    }

    try {
      setLoading(true);
      const response = await loginRequest(usuario.trim(), password);

      if (response?.token) {
        await signIn({ token: response.token, user: response.user });
      } else {
        Alert.alert('Error', 'No fue posible iniciar sesión.');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.status === 401 ? 'Credenciales incorrectas.' : 'Ocurrió un error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    signOut();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="wifi" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>¡Conexión Recuperada!</Text>
          <Text style={styles.subtitle}>
            Para sincronizar los datos guardados en modo offline, por favor inicia sesión.
          </Text>

          <InputField
            label="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            placeholder="Ej: monitor1"
          />
          <InputField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
          />

          <Pressable 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Iniciando...' : 'Iniciar Sesión y Sincronizar'}</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar (Volver al Login normal)</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  cancelText: {
    color: colors.error,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
