import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useTheme';

export type SheetHandle = { open: () => void; close: () => void };

const SPRING = { damping: 22, stiffness: 260, mass: 0.9 } as const;

type Props = {
  sheetRef: React.RefObject<SheetHandle | null>;
  children: React.ReactNode;
  maxHeightFactor?: number;
  onClose?: () => void;
};

export function Sheet({ sheetRef, children, maxHeightFactor = 0.88, onClose }: Props) {
  const H = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const [mounted, setMounted] = useState(false);
  const ty = useSharedValue(H);
  const backdrop = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const setUnmounted = useCallback(() => setMounted(false), []);

  const dismiss = useCallback(() => {
    backdrop.value = withTiming(0, { duration: 200 });
    ty.value = withTiming(H, { duration: 240 }, (finished) => {
      if (finished) runOnJS(setUnmounted)();
    });
    onCloseRef.current?.();
  }, [backdrop, ty, H, setUnmounted]);

  useImperativeHandle(sheetRef, () => ({ open: () => setMounted(true), close: dismiss }), [dismiss]);

  useEffect(() => {
    if (!mounted) return;
    ty.value = H;
    backdrop.value = 0;
    requestAnimationFrame(() => {
      backdrop.value = withTiming(1, { duration: 220 });
      ty.value = withSpring(0, SPRING);
    });
  }, [mounted, ty, backdrop, H]);

  const dismissAfterDrag = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      'worklet';
      dragStartY.value = ty.value;
    })
    .onUpdate((e) => {
      'worklet';
      const v = Math.max(0, dragStartY.value + e.translationY);
      ty.value = v;
      backdrop.value = Math.max(0, 1 - (v / H) * 0.8);
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 90 || e.velocityY > 700) {
        backdrop.value = withTiming(0, { duration: 200 });
        ty.value = withTiming(H, { duration: 240 }, (finished) => {
          if (finished) runOnJS(setUnmounted)();
        });
        runOnJS(dismissAfterDrag)();
      } else {
        ty.value = withSpring(0, SPRING);
        backdrop.value = withTiming(1, { duration: 150 });
      }
    });

  const sheetAnim = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropAnim = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnim]}>
          <Pressable onPress={dismiss} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: Math.round(H * maxHeightFactor), paddingBottom: insets.bottom + 20 },
            sheetAnim,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.gripWrap} hitSlop={{ top: 14, bottom: 6 }}>
              <View style={styles.grip} />
            </View>
          </GestureDetector>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.body}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { backgroundColor: p.backdrop },
    sheet: {
      backgroundColor: p.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 10,
      elevation: 24,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -6 },
    },
    gripWrap: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 6 },
    grip: { width: 44, height: 5, borderRadius: 3, backgroundColor: p.line },
    body: { flexShrink: 1 },
    scroll: { flexShrink: 1 },
    content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  });
