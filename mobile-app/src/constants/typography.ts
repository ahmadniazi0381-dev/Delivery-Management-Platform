export const FontFamily = {
  regular: 'System',
  bold: 'System',
  medium: 'System',
};

export const FontSize = {
  xs: 11, sm: 12, md: 14, base: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30, display: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight: 1.2, normal: 1.5, relaxed: 1.7,
};

// New consolidated export
const Typography = {
  // Font families
  fontBold:    'System',  // Platform default bold
  fontRegular: 'System',  // Platform default

  displayXL: { fontSize: 36, fontWeight: '800' as const, lineHeight: 42, letterSpacing: -0.5 },
  displayLG: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36, letterSpacing: -0.3 },
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.2 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.1 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  bodyLG: { fontSize: 17, fontWeight: '400' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySM: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.1 },
  micro: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.08 },
  button: { fontSize: 15, fontWeight: '700' as const, lineHeight: 20, letterSpacing: 0.02 },
  price: { fontSize: 18, fontWeight: '800' as const, lineHeight: 22, letterSpacing: -0.1 },
  badge: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 0.05 },
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
};

export default Typography;
