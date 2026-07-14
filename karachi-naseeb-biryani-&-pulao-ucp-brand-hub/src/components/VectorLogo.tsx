import { LogoConfig } from '../types';

interface VectorLogoProps {
  config: LogoConfig;
  size?: number;
  className?: string;
  id?: string;
}

export default function VectorLogo({ config, size = 300, className = '', id = 'vector-logo' }: VectorLogoProps) {
  const {
    textTop,
    textBottom,
    textCenter,
    textEst,
    primaryColor,
    secondaryColor,
    accentColor,
    textColor,
    badgeStyle,
    iconType,
    borderStyle,
    fontStyle
  } = config;

  // Decide font-family class/style
  let fontCls = 'font-sans';
  if (fontStyle === 'serif') fontCls = 'font-serif';
  if (fontStyle === 'traditional') fontCls = 'font-traditional';

  // Render SVG border style
  const getBorderProps = () => {
    switch (borderStyle) {
      case 'dotted':
        return { strokeDasharray: '6,6' };
      case 'double':
        // We'll manually render a double ring in the badge shapes
        return {};
      default:
        return {};
    }
  };

  const borderProps = getBorderProps();

  // Custom Icon paths for the center
  const renderCenterIcon = () => {
    switch (iconType) {
      case 'handi':
        return (
          <g transform="translate(160, 160) scale(1.3)" stroke={primaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Clay pot (Handi) body */}
            <path d="M 12,38 C 12,48 48,48 48,38 L 48,26 C 48,22 44,18 38,18 L 22,18 C 16,18 12,22 12,26 Z" fill={`${secondaryColor}20`} />
            {/* Pot Rim */}
            <ellipse cx="30" cy="18" rx="15" ry="4" fill={accentColor} stroke={accentColor} />
            {/* Lid knob */}
            <path d="M 30,14 L 30,10 M 27,10 L 33,10" stroke={accentColor} strokeWidth="3" />
            {/* Steam waves */}
            <path d="M 22,8 Q 24,4 22,0" />
            {/* Steam waves */}
            <path d="M 30,8 Q 32,4 30,0" />
            {/* Steam waves */}
            <path d="M 38,8 Q 40,4 38,0" />
            {/* Handles */}
            <path d="M 12,26 C 6,26 6,32 12,32" />
            {/* Handles */}
            <path d="M 48,26 C 54,26 54,32 48,32" />
          </g>
        );
      case 'rice':
        return (
          <g transform="translate(155, 155) scale(1.4)" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Rice Bowl */}
            <path d="M 8,24 C 8,40 52,40 52,24 Z" fill={`${secondaryColor}30`} stroke={accentColor} />
            {/* Rice grains mound */}
            <path d="M 10,24 C 18,14 42,14 50,24" fill={secondaryColor} stroke={secondaryColor} strokeWidth="2" />
            {/* Steam waves */}
            <path d="M 20,10 Q 23,5 20,0" />
            <path d="M 30,8 Q 33,3 30,-2" />
            <path d="M 40,10 Q 43,5 40,0" />
            {/* Rice textures inside bowl */}
            <path d="M 22,18 L 24,18 M 28,16 L 31,17 M 35,19 L 38,18" stroke="#ffffff" strokeWidth="2" />
            {/* Lemon slice accent */}
            <path d="M 44,22 C 46,16 52,22 44,22" fill={accentColor} stroke={accentColor} />
          </g>
        );
      case 'drumstick':
        return (
          <g transform="translate(160, 160) scale(1.3)" stroke={primaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Chicken Drumstick flesh */}
            <path d="M 35,10 C 48,15 50,30 40,40 C 30,50 15,48 10,35 C 7,27 12,18 20,14 Z" fill={`${secondaryColor}40`} />
            {/* Bone */}
            <path d="M 12,38 L -2,52" strokeWidth="3" />
            <circle cx="-2" cy="52" r="4" fill={accentColor} stroke={accentColor} />
            <circle cx="-6" cy="48" r="4" fill={accentColor} stroke={accentColor} />
            {/* Grill marks / flavor lines */}
            <path d="M 28,18 L 33,23" stroke={accentColor} />
            <path d="M 23,23 L 28,28" stroke={accentColor} />
            <path d="M 18,28 L 23,33" stroke={accentColor} />
          </g>
        );
      case 'chili':
        return (
          <g transform="translate(160, 160) scale(1.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Chili 1 (Red) */}
            <path d="M 8,42 C 16,36 34,36 40,12 C 41,8 38,6 36,8 C 24,20 12,30 2,40 C 0,42 2,44 4,44 Z" fill={accentColor} stroke={accentColor} />
            {/* Stem 1 */}
            <path d="M 38,10 Q 44,6 46,12" fill="none" stroke={primaryColor} strokeWidth="2" />
            
            {/* Chili 2 (Green / Saffron) */}
            <path d="M 42,42 C 34,36 16,36 10,12 C 9,8 12,6 14,8 C 26,20 38,30 48,40 C 50,42 48,44 46,44 Z" fill={primaryColor} stroke={primaryColor} />
            {/* Stem 2 */}
            <path d="M 12,10 Q 6,6 4,12" fill="none" stroke={accentColor} strokeWidth="2" />
          </g>
        );
      case 'crown':
        return (
          <g transform="translate(160, 160) scale(1.3)" stroke={primaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Golden Crown */}
            <path d="M 10,42 L 6,18 L 20,28 L 30,10 L 40,28 L 54,18 L 50,42 Z" fill={`${secondaryColor}40`} />
            {/* Base line */}
            <path d="M 8,42 L 52,42" stroke={accentColor} strokeWidth="3" />
            {/* Jewels on crown tips */}
            <circle cx="6" cy="18" r="3" fill={accentColor} stroke={accentColor} />
            <circle cx="20" cy="28" r="2" fill={accentColor} stroke={accentColor} />
            <circle cx="30" cy="10" r="3.5" fill={accentColor} stroke={accentColor} />
            <circle cx="40" cy="28" r="2" fill={accentColor} stroke={accentColor} />
            <circle cx="54" cy="18" r="3" fill={accentColor} stroke={accentColor} />
            {/* Crown center jewel */}
            <polygon points="30,28 35,34 30,40 25,34" fill={accentColor} stroke={accentColor} />
          </g>
        );
      default:
        return null;
    }
  };

  // Render badge background and container
  const renderBadgeBackground = () => {
    switch (badgeStyle) {
      case 'shield':
        return (
          <g>
            {/* Shield Outer Path */}
            <path
              d="M 200,20 Q 340,20 360,100 Q 380,240 200,380 Q 20,240 40,100 Q 60,20 200,20 Z"
              fill={`${secondaryColor}08`}
              stroke={primaryColor}
              strokeWidth="6"
              {...borderProps}
            />
            {/* Shield Inner Path */}
            <path
              d="M 200,32 Q 325,32 344,104 Q 362,230 200,360 Q 38,230 56,104 Q 75,32 200,32 Z"
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
            />
            {borderStyle === 'double' && (
              <path
                d="M 200,40 Q 312,40 330,108 Q 346,220 200,344 Q 54,220 70,108 Q 88,40 200,40 Z"
                fill="none"
                stroke={primaryColor}
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      case 'starburst':
        return (
          <g>
            {/* Vintage stamp / starburst */}
            <polygon
              points="
                200,10 225,23 253,16 273,36 299,35 311,60 336,68 340,95 360,111 354,138 368,160 354,184 361,211 341,230
                340,257 314,269 306,295 280,300 266,323 239,321 221,340 194,331 174,345 150,329 127,337 106,317 81,319
                68,295 43,288 41,261 20,246 25,219 10,198 23,174 15,148 33,131 32,104 53,92 59,65 83,59 95,35 121,36
                138,15 163,22
              "
              fill={`${secondaryColor}08`}
              stroke={primaryColor}
              strokeWidth="5"
              {...borderProps}
            />
            <circle cx="200" cy="200" r="150" fill="none" stroke={accentColor} strokeWidth="2" />
            {borderStyle === 'double' && (
              <circle cx="200" cy="200" r="144" fill="none" stroke={primaryColor} strokeWidth="1.5" />
            )}
          </g>
        );
      case 'hexagon':
        return (
          <g>
            <polygon
              points="200,20 356,110 356,290 200,380 44,290 44,110"
              fill={`${secondaryColor}08`}
              stroke={primaryColor}
              strokeWidth="6"
              {...borderProps}
            />
            <polygon
              points="200,32 344,115 344,285 200,368 56,285 56,115"
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
            />
            {borderStyle === 'double' && (
              <polygon
                points="200,42 334,120 334,280 200,358 66,280 66,120"
                fill="none"
                stroke={primaryColor}
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      case 'crest':
        return (
          <g>
            {/* Traditional architectural/crest shape */}
            <path
              d="M 200,20 C 270,20 340,30 350,90 C 360,150 380,180 380,200 C 380,220 360,250 350,310 C 340,370 270,380 200,380 C 130,380 60,370 50,310 C 40,250 20,220 20,200 C 20,180 40,150 50,90 C 60,30 130,20 200,20 Z"
              fill={`${secondaryColor}08`}
              stroke={primaryColor}
              strokeWidth="5"
              {...borderProps}
            />
            <path
              d="M 200,30 C 262,30 326,38 336,94 C 346,150 366,178 366,200 C 366,222 346,250 336,306 C 326,362 262,370 200,370 C 138,370 74,362 64,306 C 54,250 34,222 34,200 C 34,178 54,150 64,94 C 74,38 138,30 200,30 Z"
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
            />
            {borderStyle === 'double' && (
              <path
                d="M 200,38 C 255,38 312,46 322,98 C 332,150 352,176 352,200 C 352,224 332,150 322,302 C 312,354 255,362 200,362 C 145,362 88,354 78,302 C 68,250 48,224 48,200 C 48,176 68,150 78,98 C 88,46 145,38 200,38 Z"
                fill="none"
                stroke={primaryColor}
                strokeWidth="1.2"
              />
            )}
          </g>
        );
      case 'circle':
      default:
        return (
          <g>
            {/* Outer Circle with styling */}
            <circle
              cx="200"
              cy="200"
              r="180"
              fill={`${secondaryColor}08`}
              stroke={primaryColor}
              strokeWidth="6"
              {...borderProps}
            />
            {/* Thin Accent Ring */}
            <circle cx="200" cy="200" r="168" fill="none" stroke={accentColor} strokeWidth="2.5" />
            {/* Double ring decoration if chosen */}
            {borderStyle === 'double' && (
              <circle cx="200" cy="200" r="158" fill="none" stroke={primaryColor} strokeWidth="1.5" />
            )}
            
            {/* Circular small star/dots design for authentic traditional look */}
            <g fill={accentColor} opacity="0.6">
              <circle cx="200" cy="32" r="3" />
              <circle cx="200" cy="368" r="3" />
              <circle cx="32" cy="200" r="3" />
              <circle cx="368" cy="200" r="3" />
              <circle cx="81" cy="81" r="2" />
              <circle cx="319" cy="81" r="2" />
              <circle cx="81" cy="319" r="2" />
              <circle cx="319" cy="319" r="2" />
            </g>
          </g>
        );
    }
  };

  // Curved Paths for Circular text pathing
  // Top text path: Clockwise from 9 o'clock to 3 o'clock
  const topPathD = "M 55,200 A 145,145 0 0,1 345,200";
  // Bottom text path: Counter-clockwise along bottom
  // Since we want text to read left-to-right at the bottom:
  // An arc from 55,200 to 345,200 with sweep=0 goes from left-to-right but has text underneath.
  // To make it look extremely clean, let's render bottom text beautifully with fine positioning.
  const bottomPathD = "M 345,200 A 145,145 0 0,1 55,200"; // goes clockwise from right to left (we flip it inside/outside or use dy)

  return (
    <svg
      id={id}
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={`select-none ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Curved Path for TOP Text */}
        <path id={`top-text-path-${id}`} d={topPathD} fill="none" />
        
        {/* Curved Path for BOTTOM Text */}
        {/* We want it from 9 to 3, but bottom-facing. To read left-to-right, we can define a path from left-to-right inside or outside */}
        <path id={`bottom-text-path-${id}`} d="M 64,208 A 136,136 0 0,0 336,208" fill="none" />
        
        {/* Drop shadow for elegant premium 3D feeling */}
        <filter id="premium-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={accentColor} floodOpacity="0.12" />
        </filter>
        
        <linearGradient id="saffronGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      <g filter="url(#premium-shadow)">
        {/* 1. Badge Background & Borders */}
        {renderBadgeBackground()}

        {/* 2. Text Path TOP */}
        <text className={`${fontCls} font-extrabold uppercase tracking-[0.16em]`} fill={primaryColor} fontSize="15.5">
          <textPath href={`#top-text-path-${id}`} startOffset="50%" textAnchor="middle">
            {textTop}
          </textPath>
        </text>

        {/* 3. Text Path BOTTOM */}
        <text className={`${fontCls} font-extrabold uppercase tracking-[0.18em]`} fill={accentColor} fontSize="14">
          <textPath href={`#bottom-text-path-${id}`} startOffset="50%" textAnchor="middle" dy="5">
            {textBottom}
          </textPath>
        </text>

        {/* 4. Center Inner Ring & Ribbon */}
        <circle cx="200" cy="200" r="75" fill="#ffffff" stroke={secondaryColor} strokeWidth="2" />
        <circle cx="200" cy="200" r="70" fill="none" stroke={primaryColor} strokeWidth="1" strokeDasharray="3,3" />

        {/* Traditional ornamental stars on left and right inside center */}
        <g fill={accentColor} transform="translate(200, 200)" opacity="0.8">
          {/* Left star */}
          <path d="M -88,-4 L -82,-2 L -80,-8 L -78,-2 L -72,-4 L -76,1 L -74,7 L -80,3 L -86,7 L -84,1 Z" />
          {/* Right star */}
          <path d="M 72,-4 L 78,-2 L 80,-8 L 82,-2 L 88,-4 L 84,1 L 86,7 L 80,3 L 74,7 L 76,1 Z" />
        </g>

        {/* 5. Center Icon */}
        {renderCenterIcon()}

        {/* 6. Bold Traditional Typography Center Name ("UCP") */}
        {textCenter && (
          <g transform="translate(200, 252)">
            {/* Little Ribbon background for UCP */}
            <path
              d="M -50,-10 L 50,-10 L 42,12 L -42,12 Z"
              fill={accentColor}
            />
            <text
              className={`${fontCls} font-black tracking-widest`}
              fill="#ffffff"
              fontSize="15"
              textAnchor="middle"
              y="6"
            >
              {textCenter}
            </text>
          </g>
        )}

        {/* 7. Est. Year Text */}
        {textEst && (
          <text
            className="font-mono text-[9px] font-bold uppercase tracking-widest"
            fill={primaryColor}
            x="200"
            y="115"
            textAnchor="middle"
            opacity="0.9"
          >
            {textEst}
          </text>
        )}
        
        {/* Tiny spice/wheat visual ornaments flanking center bottom */}
        <g stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity="0.5">
          <path d="M 175, 275 C 165, 278 158, 270 158, 270" />
          <path d="M 225, 275 C 235, 278 242, 270 242, 270" />
        </g>
      </g>
    </svg>
  );
}
