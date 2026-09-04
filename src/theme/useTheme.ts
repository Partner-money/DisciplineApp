import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import { darkPalette, lightPalette, type Palette } from '@/theme/tokens';

export type { Palette };

/** Тёмная тема сейчас: либо выбрана вручную, либо пришла из системы. */
export const useIsDark = () => {
  const mode = useSettings((s) => s.themeMode);
  const system = useColorScheme();
  return mode === 'system' ? system === 'dark' : mode === 'dark';
};

export const usePalette = (): Palette => (useIsDark() ? darkPalette : lightPalette);

/**
 * Собирает StyleSheet под текущую палитру. Фабрику объявляй на уровне модуля —
 * тогда пересборка происходит только при смене темы.
 */
export function useThemedStyles<T>(factory: (p: Palette) => T): T {
  const palette = usePalette();
  return useMemo(() => factory(palette), [factory, palette]);
}
