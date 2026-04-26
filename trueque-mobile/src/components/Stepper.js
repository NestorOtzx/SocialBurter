import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import { REGISTRO_STEPS } from '../constants/options';

export default function Stepper({ currentStep, steps = REGISTRO_STEPS.pre }) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <View key={step.number} style={styles.item}>
            <View style={[styles.circle, isCompleted && styles.completedCircle, isActive && styles.activeCircle]}>
              <Text style={[styles.number, isCompleted && styles.completedNumber, isActive && styles.activeNumber]}>
                {isCompleted ? '✓' : step.number}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel, isCompleted && styles.completedLabel]}>{step.label}</Text>
            {index < steps.length - 1 ? <View style={[styles.line, isCompleted && styles.activeLine]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  completedCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeCircle: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  number: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.semibold,
  },
  completedNumber: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  activeNumber: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  completedLabel: {
    color: colors.primary,
  },
  activeLabel: {
    color: colors.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  line: {
    position: 'absolute',
    top: 16,
    right: '-50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  activeLine: {
    backgroundColor: colors.primary,
  },
});
