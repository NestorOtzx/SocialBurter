import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AppHeader from '../components/AppHeader';
import MenuCard from '../components/MenuCard';
import { colors, spacing } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const menuItems = [
    {
      icon: <Feather name="clipboard" size={36} color={colors.primary} />,
      title: 'Pre‑registro de participantes',
      description: 'Carga anticipada de datos personales, finca y condiciones',
      route: 'PreRegistroWizardScreen',
    },
    {
      icon: <Feather name="refresh-cw" size={36} color={colors.primary} />,
      title: 'Registro día del trueque',
      description: 'Registro rápido de aportes usando datos ya cargados',
      route: 'RegistroRapidoTruequeScreen',
    },
    {
      icon: <Feather name="award" size={36} color={colors.primary} />,
      title: 'Ranking y Premiación',
      description: 'Ver el ranking según puntaje acumulado',
      route: 'RankingScreen',
    },
    {
      icon: <Feather name="bar-chart-2" size={36} color={colors.primary} />,
      title: 'Histórico de participante',
      description: 'Consulta el histórico por número de cédula',
      route: 'HistoricoScreen',
    },
    {
      icon: <Feather name="settings" size={36} color={colors.primary} />,
      title: 'Configurar reglas anuales',
      description: 'Parametrizar precios y desempates',
      route: 'ConfiguracionScreen',
    },
  ];

  return (
    <View style={styles.screen}>
      <AppHeader title="Trueque Municipal" fontSize={20} />
      <View style={styles.secondaryBar} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <MenuCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  secondaryBar: {
    height: 8,
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
