import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LevelProgress } from '@/lib/xp';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

export function LevelCard({ progress }: { progress: LevelProgress }) {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const pct = Math.round(Math.min(1, Math.max(0, progress.ratio)) * 100);

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={s.badge}>
          <Text style={s.badgeNum}>{progress.level}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.title}>{progress.title}</Text>
          <Text style={s.sub}>{progress.xp} XP всего</Text>
        </View>
        <Feather name="award" size={22} color={p.accent} />
      </View>

      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.footer}>
        {progress.into} / {progress.need} до уровня {progress.level + 1}
      </Text>
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: p.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.line,
      padding: 18,
      marginTop: 14,
    },
    head: { flexDirection: 'row', alignItems: 'center' },
    badge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: p.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeNum: { fontFamily: fonts.displayBold, fontSize: 26, color: p.accentDeep },
    title: { fontFamily: fonts.displayBold, fontSize: 22, color: p.ink },
    sub: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, marginTop: 2 },
    track: { height: 8, borderRadius: 4, backgroundColor: p.line, marginTop: 16 },
    fill: { height: 8, borderRadius: 4, backgroundColor: p.accent },
    footer: { fontFamily: fonts.medium, fontSize: 12, color: p.muted, marginTop: 8 },
  });
