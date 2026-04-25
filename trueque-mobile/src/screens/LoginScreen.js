import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import InputField from '../components/InputField';
import { colors, fonts, spacing } from '../constants/theme';
import { loginRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
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

  return (
    <View style={styles.screen}>
      <AppHeader title="Ingreso de Monitores" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.content}
      >
        <View style={styles.formCard}>
          <Text style={styles.title}>Inicio de sesión</Text>
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
          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
          </Pressable>
          <Text style={styles.footer}>Versión 1.0.0</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  formCard: {
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontFamily: fonts.bold,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.lightText,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
});
