import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

/**
 * Настройки приложения живут отдельно от привычек: сброс данных не должен
 * возвращать тему к системной.
 */
export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'discipline-settings-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
