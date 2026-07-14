import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { BrandColor } from '../types';

interface ColorPaletteProps {
  primary: string;
  secondary: string;
  accent: string;
}

export default function ColorPalette({ primary, secondary, accent }: ColorPaletteProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const colors: BrandColor[] = [
    {
      name: 'Saffron Spice',
      hex: primary,
      description: 'Represents rich, aromatic saffron threads layered in Karachi biryani, invoking appetite and warmth.',
      usage: 'Primary logo branding, call-to-actions, headers.'
    },
    {
      name: 'Royal Gold',
      hex: secondary,
      description: 'Represents premium quality ingredients like golden basmati rice and traditional royal Mughlai legacy.',
      usage: 'Secondary badges, borders, highlighting, stars.'
    },
    {
      name: 'Fiery Red Chilli',
      hex: accent,
      description: 'The soul of spice! Denotes authentic local flavors, sharp taste, and hot, fresh delivery.',
      usage: 'Accents, ribbons, UCP badge background, alerts.'
    },
    {
      name: 'Basmati Cream',
      hex: '#faf8f5',
      description: 'A soothing off-white resembling fluffy steam-cooked rice grains, bringing clean negative space.',
      usage: 'App background, card backgrounds, body text contrast.'
    },
    {
      name: 'Charcoal Handi',
      hex: '#2c1a11',
      description: 'A deep earthy dark brown reflecting slow-cooking clay pots (handis) and smoke-infused firewood.',
      usage: 'Main typography, primary headings, dark card headers.'
    },
    {
      name: 'Fresh Coriander',
      hex: '#14532d',
      description: 'The final aromatic garnishing! Inspires freshness, purity, and standard halal catering.',
      usage: 'Status indicators, herb icons, positive labels.'
    }
  ];

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div id="color-palette-section" class="space-y-6">
      <div class="space-y-2">
        <h3 class="text-xl font-bold font-sans tracking-tight text-brand-charcoal">The Traditional Saffron-Fiery Palette</h3>
        <p class="text-sm text-gray-600 max-w-2xl">
          A vibrant color system inspired directly by authentic Pakistani street-food banners, featuring rich saffron, deep spices, and royal gold accents.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color) => {
          const isCopied = copiedHex === color.hex;
          return (
            <div
              id={`color-card-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
              key={color.name}
              class="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div class="space-y-3">
                {/* Visual Swatch */}
                <div
                  class="h-24 w-full rounded-xl flex items-end justify-end p-2 transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: color.hex }}
                >
                  <button
                    id={`copy-btn-${color.hex}`}
                    onClick={() => copyToClipboard(color.hex)}
                    class="p-2 rounded-lg bg-white/90 hover:bg-white text-gray-800 shadow-xs backdrop-blur-xs transition-colors flex items-center gap-1.5 text-xs font-mono font-semibold"
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} class="text-green-600" />
                        <span class="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>{color.hex}</span>
                      </>
                    )}
                  </button>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-base text-brand-charcoal">{color.name}</span>
                    <span class="font-mono text-xs text-gray-500 font-semibold">{color.hex}</span>
                  </div>
                  <p class="text-xs text-gray-500 leading-relaxed">{color.description}</p>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span class="text-gray-400 uppercase tracking-wider font-semibold">Recommended Usage</span>
                <span class="text-brand-saffron font-medium">{color.usage}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
