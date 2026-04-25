import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  error,
  helperText,
  multiline = false,
  rightElement = null,
  editable = true,
  compact = false,
}) {
  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      {label ? <Text style={[styles.label, compact && styles.compactLabel]}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          compact && styles.compactInputContainer,
          !!error && styles.errorBorder,
          !editable && styles.disabledContainer,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.lightText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
          editable={editable}
          style={[styles.input, compact && styles.compactInput, multiline && styles.multiline]}
        />
        {rightElement}
      </View>
      {error ? <Text style={[styles.error, compact && styles.compactMeta]}>{error}</Text> : null}
      {!error && helperText ? <Text style={[styles.helper, compact && styles.compactMeta]}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  compactWrapper: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.semibold,
  },
  compactLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  inputContainer: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  compactInputContainer: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  disabledContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.regular,
    paddingVertical: 12,
  },
  compactInput: {
    fontSize: 12,
    paddingVertical: 6,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  helper: {
    marginTop: 6,
    color: colors.lightText,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  error: {
    marginTop: 6,
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  compactMeta: {
    fontSize: 10,
    marginTop: 3,
  },
  errorBorder: {
    borderColor: colors.error,
  },
});
