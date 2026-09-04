import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: object }) {
  const s = useThemedStyles(makeSection);
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function Chip({
  active,
  label,
  onPress,
  activeBg,
  activeColor,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  activeBg?: string;
  activeColor?: string;
}) {
  const p = usePalette();
  const s = useThemedStyles(makeChip);
  const bg = activeBg ?? p.ink;
  const fg = activeColor ?? p.onAccent;
  return (
    <Pressable
      onPress={onPress}
      style={[s.wrap, { backgroundColor: active ? bg : 'transparent', borderColor: active ? bg : p.line }]}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: active ? fg : p.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  const s = useThemedStyles(makeRow);
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const makeSection = (p: Palette) =>
  StyleSheet.create({
    label: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: p.muted,
      marginTop: 18,
      marginBottom: 10,
    },
  });

const makeChip = (_p: Palette) =>
  StyleSheet.create({
    wrap: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
  });

const makeRow = (p: Palette) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    label: { fontFamily: fonts.medium, fontSize: 14, color: p.muted },
    value: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: p.ink,
      maxWidth: '65%',
      textAlign: 'right',
      flexShrink: 1,
    },
  });
