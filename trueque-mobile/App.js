import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import { useAuthStore } from './src/store/authStore';

// Fix scroll on Expo Web: allow body to scroll naturally
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'expo-web-scroll-fix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      html, body { margin: 0; padding: 0; height: auto; min-height: 100%; overflow-y: auto !important; }
      #root { height: auto; min-height: 100vh; display: flex; flex-direction: column; }
      #root > div { flex: 1 1 auto; min-height: 0; }
    `;
    document.head.appendChild(style);
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  if (!fontsLoaded || isBootstrapping) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
