import { useState } from 'react';
import { BrandTypography } from '../types';

export default function BrandTypographyShowcase() {
  const [customText, setCustomText] = useState('Karachi Naseeb Biryani And Pulao ucp');

  const typographySpecs: BrandTypography[] = [
    {
      name: 'Cinzel (Serif Display)',
      purpose: 'Brand Titles, Premium Packaging Labels, Banner Headings',
      fontFamily: 'font-serif',
      weight: 'font-extrabold',
      example: 'CHICKEN BIRYANI & FRESH BEEF PULAO'
    },
    {
      name: 'Reem Kufi (Urdu Calligraphic Accent)',
      purpose: 'Urdu Subheadings, Cultural Badges, Slogans',
      fontFamily: 'font-traditional',
      weight: 'font-bold',
      example: 'کراچی نصیب بریانی اینڈ پلاؤ'
    },
    {
      name: 'Plus Jakarta Sans (Modern User Interface)',
      purpose: 'App menus, web forms, body text, buttons, mobile nav',
      fontFamily: 'font-sans',
      weight: 'font-semibold',
      example: 'Add extra raita, double chicken peace, hot serving'
    },
    {
      name: 'JetBrains Mono (Technical Details)',
      purpose: 'Price values, food calories, metadata, order receipts',
      fontFamily: 'font-mono',
      weight: 'font-semibold',
      example: 'ORDER-ID: #KNP-UCP-2026'
    }
  ];

  return (
    <div id="typography-section" class="space-y-6">
      <div class="space-y-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold font-sans tracking-tight text-brand-charcoal">Bold, Traditional Typography Design</h3>
          <p class="text-sm text-gray-600 max-w-xl">
            A carefully selected set of traditional calligraphic styles and high-contrast, modern UI fonts that express heritage with digital clarity.
          </p>
        </div>
        
        {/* Realtime font tester */}
        <div class="w-full md:w-80">
          <label class="block text-xs font-bold uppercase tracking-wider text-brand-saffron mb-1.5">Interactive Font Tester</label>
          <input
            id="typography-tester-input"
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type sample text..."
            class="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-saffron transition-colors"
          />
        </div>
      </div>

      <div class="space-y-4">
        {typographySpecs.map((spec) => (
          <div
            id={`typo-card-${spec.name.toLowerCase().split(' ')[0]}`}
            key={spec.name}
            class="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-3 gap-2">
              <span class="font-bold text-base text-brand-charcoal">{spec.name}</span>
              <span class="text-xs bg-brand-saffron/10 text-brand-saffron px-2.5 py-1 rounded-full font-semibold">
                {spec.purpose}
              </span>
            </div>

            <div class="space-y-2">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Static Sample</span>
              <p class={`${spec.fontFamily} ${spec.weight} text-lg text-brand-charcoal leading-snug`}>
                {spec.example}
              </p>
            </div>

            <div class="bg-[#faf8f5] rounded-xl p-3 border border-dashed border-gray-200 space-y-1">
              <span class="text-[10px] font-bold text-brand-saffron uppercase tracking-widest font-mono">Live Preview</span>
              <p class={`${spec.fontFamily} ${spec.weight} text-xl text-brand-charcoal truncate`}>
                {customText || 'Type something...'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
