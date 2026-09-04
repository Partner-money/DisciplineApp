export interface Palette {
  bg: string;
  card: string;
  elevated: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  /** Затемнение под шторкой. */
  backdrop: string;
  /** Клетка тепловой карты без запланированных дел. */
  heatEmpty: string;
  /** Четыре ступени заполненности тепловой карты, от слабой к полной. */
  heatLevels: readonly [string, string, string, string];
}

export const lightPalette: Palette = {
  bg: '#FAF5EE',
  card: '#FFFFFF',
  elevated: '#F3EBDD',
  line: '#E9DFD0',
  ink: '#2A2118',
  muted: '#8B7B6A',
  accent: '#9C6B3F',
  accentDeep: '#7C5330',
  accentSoft: '#F0E3D2',
  onAccent: '#FFF9F0',
  success: '#5F7A55',
  successSoft: '#E4EADB',
  danger: '#BC5B33',
  dangerSoft: '#F6E2D7',
  backdrop: 'rgba(42,33,24,0.45)',
  heatEmpty: '#F1EAE0',
  heatLevels: ['#EEDFCB', '#DFC09A', '#C49464', '#9C6B3F'],
};

// Тёмная палитра остаётся тёплой: не чёрный с серым, а глубокий кофейный.
// Акцент светлее, чем в дневной теме, иначе он тонет в фоне.
export const darkPalette: Palette = {
  bg: '#17120D',
  card: '#211A13',
  elevated: '#2B2219',
  line: '#3A2F23',
  ink: '#F2E9DC',
  muted: '#A6937E',
  accent: '#C89058',
  accentDeep: '#E0AE79',
  accentSoft: '#3A2A1B',
  onAccent: '#1A130C',
  success: '#8CA97E',
  successSoft: '#26301F',
  danger: '#E0805A',
  dangerSoft: '#3A2016',
  backdrop: 'rgba(0,0,0,0.62)',
  heatEmpty: '#241C14',
  heatLevels: ['#3A2A1B', '#6B4A2C', '#9C6B3F', '#C89058'],
};

export const habitColors = [
  '#B08968',
  '#C4744F',
  '#7D8C5C',
  '#6F4E37',
  '#C89B8C',
  '#5B7B6F',
  '#C99B45',
  '#8C6BB1',
] as const;

export const habitColor = (i: number): string => {
  const n = habitColors.length;
  return habitColors[((i % n) + n) % n];
};

/**
 * Цвет поверх habitColors. Сами цвета привычек с темой не меняются, поэтому и
 * подпись на них должна быть постоянной: палитровый onAccent в тёмной теме
 * становится почти чёрным и теряется на коричневом.
 */
export const onHabitColor = '#FFF9F0';

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  // у Yeseva One одно начертание, поэтому оба токена ведут на него
  display: 'YesevaOne_400Regular',
  displayBold: 'YesevaOne_400Regular',
} as const;

export const radii = { md: 14, lg: 20, xl: 28 } as const;
