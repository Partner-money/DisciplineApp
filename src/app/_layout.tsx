import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { YesevaOne_400Regular } from '@expo-google-fonts/yeseva-one';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { reconcileNotifications } from '@/lib/notifications';
import { useHabits } from '@/store/habits';
import { useIsDark, usePalette } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const p = usePalette();
  const isDark = useIsDark();
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    YesevaOne_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // корневой фон под навигационной панелью Android — иначе в тёмной теме
  // из-под приложения светит белым
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);

  // Приводим расписание пушей к стору — но строго после гидратации persist:
  // прочитав habits раньше, мы увидим пустой список и снесём все напоминания.
  useEffect(() => {
    const run = () => void reconcileNotifications(useHabits.getState().habits);
    if (useHabits.persist.hasHydrated()) {
      run();
      return;
    }
    return useHabits.persist.onFinishHydration(run);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: p.bg }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: p.bg },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
