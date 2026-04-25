import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RankingScreen from '../screens/RankingScreen';
import HistoricoScreen from '../screens/HistoricoScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import RegistroWizard from '../screens/registro/RegistroWizard';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="PreRegistroWizardScreen">
              {(props) => <RegistroWizard {...props} tipoRegistro="pre" />}
            </Stack.Screen>
            <Stack.Screen name="RegistroRapidoTruequeScreen">
              {(props) => <RegistroWizard {...props} tipoRegistro="diaTrueque" />}
            </Stack.Screen>
            <Stack.Screen name="RegistroWizard">
              {(props) => <RegistroWizard {...props} tipoRegistro="pre" />}
            </Stack.Screen>
            <Stack.Screen name="RankingScreen" component={RankingScreen} />
            <Stack.Screen name="HistoricoScreen" component={HistoricoScreen} />
            <Stack.Screen name="ConfiguracionScreen" component={ConfiguracionScreen} />
          </>
        ) : (
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
