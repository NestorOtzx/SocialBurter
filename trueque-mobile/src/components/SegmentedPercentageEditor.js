import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

function clampPercent(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return '';
  }

  return String(Math.min(100, Math.max(0, Math.round(numericValue))));
}

function getSafeValue(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function getTotal(values, segments) {
  return segments.reduce((sum, segment) => sum + getSafeValue(values[segment.key]), 0);
}

function getVisualSegments(segments, values) {
  return segments
    .map((segment) => ({
      ...segment,
      value: getSafeValue(values[segment.key]),
    }))
    .filter((segment) => segment.value > 0);
}

function getStatus(total) {
  if (total === 100) {
    return {
      label: 'Total exacto: 100%',
      tone: 'ok',
    };
  }

  if (total < 100) {
    return {
      label: `Faltante: ${100 - total}%`,
      tone: 'missing',
    };
  }

  return {
    label: `Sobrante: ${total - 100}%`,
    tone: 'overflow',
  };
}

export default function SegmentedPercentageEditor({ segments, values, onChange }) {
  const [drafts, setDrafts] = useState(() =>
    segments.reduce((acc, segment) => {
      acc[segment.key] = String(getSafeValue(values[segment.key]));
      return acc;
    }, {})
  );

  useEffect(() => {
    setDrafts(
      segments.reduce((acc, segment) => {
        acc[segment.key] = String(getSafeValue(values[segment.key]));
        return acc;
      }, {})
    );
  }, [segments, values]);

  const total = useMemo(() => getTotal(values, segments), [segments, values]);
  const status = useMemo(() => getStatus(total), [total]);
  const visualSegments = useMemo(() => getVisualSegments(segments, values), [segments, values]);
  const visibleTotal = Math.max(total, 100);

  const handleDraftChange = (key, nextDraft) => {
    if (!/^\d*$/.test(nextDraft)) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [key]: nextDraft,
    }));

    onChange({
      ...values,
      [key]: nextDraft === '' ? 0 : getSafeValue(nextDraft),
    });
  };

  const commitValue = (key, nextDraft) => {
    const normalized = clampPercent(nextDraft);
    const nextValue = normalized === '' ? 0 : Number(normalized);

    setDrafts((current) => ({
      ...current,
      [key]: normalized === '' ? '0' : normalized,
    }));

    onChange({
      ...values,
      [key]: nextValue,
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.barCard}>
        <View style={styles.barTrack}>
          {visualSegments.length ? (
            visualSegments.map((segment) => (
              <View
                key={segment.key}
                style={[
                  styles.segment,
                  {
                    width: `${(segment.value / visibleTotal) * 100}%`,
                    backgroundColor: segment.color,
                  },
                ]}
              >
                <Text style={styles.segmentLabel} numberOfLines={1}>
                  {segment.label}
                </Text>
                <Text style={styles.segmentValue}>{segment.value}%</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aun no hay porcentajes asignados</Text>
            </View>
          )}
        </View>

        {total < 100 ? (
          <View style={[styles.deltaBar, styles.missingBar]}>
            <Text style={styles.deltaLabel}>Faltante</Text>
            <Text style={styles.deltaValue}>{100 - total}%</Text>
          </View>
        ) : null}

        {total > 100 ? (
          <View style={[styles.deltaBar, styles.overflowBar]}>
            <Text style={styles.deltaLabel}>Sobrante</Text>
            <Text style={styles.deltaValue}>{total - 100}%</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.statusPill,
            status.tone === 'ok' && styles.statusOk,
            status.tone === 'missing' && styles.statusMissing,
            status.tone === 'overflow' && styles.statusOverflow,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status.tone === 'ok' && styles.statusOkText,
              status.tone === 'missing' && styles.statusMissingText,
              status.tone === 'overflow' && styles.statusOverflowText,
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.inputsGrid}>
        {segments.map((segment) => (
          <View key={segment.key} style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={[styles.swatch, { backgroundColor: segment.color }]} />
              <Text style={styles.inputLabel}>{segment.label}</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={drafts[segment.key]}
                onChangeText={(nextDraft) => handleDraftChange(segment.key, nextDraft)}
                onBlur={() => commitValue(segment.key, drafts[segment.key])}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.percentBadge}>%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
  },
  barCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 16,
  },
  barTrack: {
    flexDirection: 'row',
    minHeight: 104,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#edf5f1',
  },
  segment: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.55)',
  },
  segmentLabel: {
    fontSize: 11,
    color: '#163024',
    fontFamily: fonts.semibold,
  },
  segmentValue: {
    fontSize: 20,
    color: '#163024',
    fontFamily: fonts.bold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    color: colors.lightText,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  deltaBar: {
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missingBar: {
    backgroundColor: '#FFF4CC',
  },
  overflowBar: {
    backgroundColor: '#FDE2E0',
  },
  deltaLabel: {
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  deltaValue: {
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  statusPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusOk: {
    backgroundColor: colors.primarySurface,
  },
  statusMissing: {
    backgroundColor: '#FFF4CC',
  },
  statusOverflow: {
    backgroundColor: '#FDE2E0',
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  statusOkText: {
    color: colors.primary,
  },
  statusMissingText: {
    color: '#8A5A00',
  },
  statusOverflowText: {
    color: colors.error,
  },
  inputsGrid: {
    marginTop: spacing.md,
    gap: 10,
  },
  inputCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 8,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minHeight: 42,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  percentBadge: {
    color: colors.mutedText,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
});
