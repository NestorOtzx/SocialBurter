import React, { useState } from 'react';
import { Alert, Dimensions, ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

  const { width, height } = Dimensions.get('window');

  return (
    <ImageBackground
      source={require('../../assets/Toribio.jpg')}
      style={[styles.screen, { width, height }]}
      resizeMode="cover"
      blurRadius={Platform.OS !== 'web' ? 8 : 0}
      imageStyle={Platform.OS === 'web'
        ? { width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)' }
        : undefined
      }
    >
      {/* Overlay oscuro para no distraer */}
      <View style={styles.imageOverlay} />

      {/* Cabecera con identidad del evento */}
      <SafeAreaView edges={['top']} style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.leafIcon}>
            <Feather name="feather" size={36} color={colors.primarySurface} />
          </View>
          <Text style={styles.heroTitle}>Trueque Municipal</Text>
          <Text style={styles.heroSubtitle}>Toribío, Cauca</Text>
        </View>
        <View style={styles.accentStripe} />
      </SafeAreaView>

      {/* Formulario flotante */}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 35, 18, 0.55)',
  },
  hero: {
    backgroundColor: 'rgba(45, 106, 79, 0.82)',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  leafIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.primarySurface,
    fontFamily: fonts.regular,
    marginTop: 6,
    textAlign: 'center',
  },
  accentStripe: {
    height: 4,
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontFamily: fonts.bold,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
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
