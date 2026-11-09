import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { fmtTime } from './format';
import { colors, radius, shadow, spacing } from './theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? '#14141a'
        : colors.card;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? colors.border : bg,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'ghost' && { color: colors.text },
          variant === 'danger' && { color: '#ffffff' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return <View testID={testID} style={[styles.card, style]}>{children}</View>;
}

export function Field(props: TextInputProps & { label?: string; inputRef?: React.Ref<any> }) {
  const { label, style, inputRef, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        placeholderTextColor={colors.muted}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Indietro</Text>
        </Pressable>
      ) : null}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {right}
      </View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}
    >
      <Text style={[styles.chipText, active && { color: colors.accentText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Barra del recupero, fissa in basso sopra al contenuto. */
export function RestTimerBar({
  label,
  remaining,
  total,
  finished,
  onAdjust,
  onSkip,
}: {
  label: string;
  remaining: number;
  total: number;
  finished: boolean;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}) {
  const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 1;
  return (
    <View
      style={[
        styles.timerBar,
        
      ]}
    >
      <View style={styles.timerTrack}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${Math.round((finished ? 1 : progress) * 100)}%`,
              backgroundColor: finished ? '#ffffff' : colors.accent,
            },
          ]}
        />
      </View>
      <View style={styles.timerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.timerLabel} numberOfLines={1}>
            {finished ? 'Recupero finito!' : `Recupero · ${label}`}
          </Text>
          <Text
            style={styles.timerTime}
          >
            {finished ? 'Vai con la prossima serie' : fmtTime(remaining)}
          </Text>
        </View>
        {finished ? null : (
          <>
            <Pressable onPress={() => onAdjust(-15)} style={styles.timerBtn}>
              <Text style={styles.timerBtnText}>−15</Text>
            </Pressable>
            <Pressable onPress={() => onAdjust(15)} style={styles.timerBtn}>
              <Text style={styles.timerBtnText}>+15</Text>
            </Pressable>
          </>
        )}
        <Pressable onPress={onSkip} style={[styles.timerBtn, styles.timerSkip]}>
          <Text style={[styles.timerBtnText, { color: '#000' }]}>{finished ? 'OK' : 'Salta'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  buttonText: { color: colors.accentText, fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 0,
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: 6 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, flexShrink: 1 },
  back: { color: colors.accentInk, fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  timerBar: {
    backgroundColor: '#14141a',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#14141a',
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  timerTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a3a40',
    overflow: 'hidden',
  },
  timerFill: { height: 4, borderRadius: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timerLabel: { color: '#b5b5bd', fontSize: 12, fontWeight: '600' },
  timerTime: { color: '#ffffff', fontSize: 30, fontWeight: '900' },
  timerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#2a2a30',
    borderWidth: 0,
  },
  timerSkip: { backgroundColor: '#ffffff' },
  timerBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
