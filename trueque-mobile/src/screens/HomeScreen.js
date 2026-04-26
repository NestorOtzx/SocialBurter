import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuCard from '../components/MenuCard';
import { colors, fonts, spacing } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

const BANNER_SCROLL_THRESHOLD = 160;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((state) => state.signOut);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas cerrar sesión?')) signOut();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  const menuItems = [
    {
      icon: <Feather name="user-plus" size={28} color={colors.primary} />,
      title: 'Pre‑registro de participantes',
      description: 'Carga anticipada de datos personales, finca y condiciones',
      route: 'PreRegistroWizardScreen',
      accentColor: colors.primary,
    },
    {
      icon: <Feather name="package" size={28} color={colors.accent} />,
      title: 'Registro día del trueque',
      description: 'Registro rápido de aportes usando datos ya cargados',
      route: 'RegistroRapidoTruequeScreen',
      accentColor: colors.accent,
    },
    {
      icon: <Feather name="award" size={28} color={colors.gold} />,
      title: 'Ranking y Premiación',
      description: 'Ver el ranking según puntaje acumulado',
      route: 'RankingScreen',
      accentColor: colors.gold,
    },
    {
      icon: <Feather name="bar-chart-2" size={28} color={colors.primaryLight} />,
      title: 'Histórico de participante',
      description: 'Consulta el histórico por número de cédula',
      route: 'HistoricoScreen',
      accentColor: colors.primaryLight,
    },
    {
      icon: <Feather name="sliders" size={28} color={colors.mutedText} />,
      title: 'Configurar reglas anuales',
      description: 'Parametrizar precios y desempates',
      route: 'ConfiguracionScreen',
      accentColor: colors.mutedText,
    },
  ];

  return (
    <View style={styles.screen}>
      {/* Navbar compacta pegajosa */}
      {scrolled && (
        <View style={[styles.stickyNav, { paddingTop: insets.top, height: 48 + insets.top }]}>
          <Text style={styles.stickyNavTitle}>Trueque Municipal</Text>
          <Pressable onPress={handleLogout} style={styles.stickyLogoutBtn} hitSlop={10}>
            <Feather name="log-out" size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setScrolled(y > BANNER_SCROLL_THRESHOLD);
        }}
      >
        {/* Banner completo */}
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <Text style={styles.bannerLabel}>EVENTO ACTIVO</Text>
            <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={10}>
              <Feather name="log-out" size={18} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
          <Text style={styles.bannerTitle}>Trueque Municipal{'\n'}Toribío 2026</Text>
          <Text style={styles.bannerSub}>Cauca, Colombia</Text>
          <View style={styles.bannerBadge}>
            <Feather name="check-circle" size={13} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.bannerBadgeText}>Sistema activo</Text>
          </View>
          <View style={styles.bannerDecor}>
            <Feather name="sun" size={90} color="rgba(255,255,255,0.08)" />
          </View>
        </View>

        {/* Sección */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Módulos del sistema</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <MenuCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              accentColor={item.accentColor}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>

        <Text style={styles.footerText}>Trueque Municipal · Versión 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },

  /* Navbar compacta pegajosa */
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  stickyNavTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  stickyLogoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  /* Banner */
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: spacing.lg,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerLabel: {
    fontSize: 10,
    color: colors.accentLight,
    fontFamily: fonts.bold,
    letterSpacing: 2,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bannerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    lineHeight: 32,
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: fonts.regular,
    marginBottom: 16,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  bannerDecor: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },

  /* Sección */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  footerText: {
    textAlign: 'center',
    color: colors.lightText,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
  },
});
