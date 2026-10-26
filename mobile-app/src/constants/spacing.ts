// Named exports for backward compat
export const Spacing = {
  '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32,
  '10': 40, '12': 48, '16': 64,
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48, huge: 64,
  screenPadding: 16, cardPadding: 16, cardPaddingLG: 20, sectionGap: 32,
  itemGap: 12, elementGap: 8, iconSize: 20, iconSizeLG: 24,
  avatarSM: 32, avatar: 44, avatarLG: 56, touchTarget: 44,
  borderRadius: 12, borderRadiusLG: 20, borderRadiusFull: 999,
};

export const BorderRadius = {
  sm: 6, md: 12, lg: 18, xl: 24, full: 999,
};

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
};

export default Spacing;
