import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

const SIZE = 212;
const R = 92;
const C = 2 * Math.PI * R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const statusLabel = (done: number) => {
  if (done === 0) return 'время начать';
  const m10 = done % 10;
  const m100 = done % 100;
  if (m10 === 1 && m100 !== 11) return 'привычка выполнена';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'привычки выполнено';
  return 'привычек выполнено';
};

export function DayRing({ done, total }: { done: number; total: number }) {
  const p = usePalette();
  const styles = useThemedStyles(makeStyles);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(total > 0 ? done / total : 0, { damping: 16, stiffness: 90 });
  }, [done, total, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - progress.value) }));

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={p.line} strokeWidth={12} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={p.accent}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        {total > 0 ? (
          <View style={styles.center}>
            <Text style={styles.big}>
              {done}
              <Text style={styles.small}>/{total}</Text>
            </Text>
            <Text style={styles.label}>{statusLabel(done)}</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.empty}>Добавь первую привычку — и кольцо оживёт</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    big: { fontFamily: fonts.displayBold, fontSize: 60, color: p.ink, lineHeight: 68 },
    small: { fontFamily: fonts.display, fontSize: 28, color: p.muted },
    label: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, marginTop: 4 },
    empty: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: p.muted,
      textAlign: 'center',
      paddingHorizontal: 36,
      lineHeight: 20,
    },
  });
