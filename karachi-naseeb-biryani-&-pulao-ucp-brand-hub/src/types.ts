export interface LogoConfig {
  textTop: string;
  textBottom: string;
  textCenter: string;
  textEst: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  badgeStyle: 'circle' | 'shield' | 'starburst' | 'hexagon' | 'crest';
  iconType: 'handi' | 'rice' | 'drumstick' | 'chili' | 'crown';
  borderStyle: 'solid' | 'double' | 'dotted' | 'scalloped';
  fontStyle: 'serif' | 'sans' | 'traditional';
}

export interface BrandColor {
  name: string;
  hex: string;
  description: string;
  usage: string;
}

export interface BrandTypography {
  name: string;
  purpose: string;
  fontFamily: string;
  weight: string;
  example: string;
}
