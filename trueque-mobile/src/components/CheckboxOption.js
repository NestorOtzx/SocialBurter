import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, fonts } from '../constants/theme';

export default function CheckboxOption({ label, selected, onPress, compact = false }) {
  return (
    <Pressable style={[styles.container, compact && styles.compactContainer]} onPress={onPress}>
      <View style={[styles.box, selected && styles.selectedBox]}>
        {selected ? <Feather name="check" size={14} color={colors.background} /> : null}
      </View>
      <Text style={[styles.label, compact && styles.compactLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 10,
  },
  compactContainer: {
    marginRight: 12,
    marginBottom: 8,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  compactLabel: {
    fontSize: 12,
  },
});
