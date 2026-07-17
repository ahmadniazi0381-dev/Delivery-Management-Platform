import { Platform } from 'react-native';

export const FontFamily = {
  regular:    Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium:     Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  semibold:   Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
  bold:       Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
  mono:       Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 38,
};

export const LineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.65,
};

export const FontWeight: Record<string, '400' | '500' | '600' | '700' | '800' | '900'> = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
  black:     '900',
};
