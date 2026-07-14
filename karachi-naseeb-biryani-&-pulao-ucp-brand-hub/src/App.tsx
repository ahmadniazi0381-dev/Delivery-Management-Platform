import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Palette,
  Sliders,
  Type,
  Eye,
  Download,
  Share2,
  Bookmark,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import { LogoConfig } from './types';
import VectorLogo from './components/VectorLogo';
import ColorPalette from './components/ColorPalette';
import BrandTypographyShowcase from './components/BrandTypographyShowcase';
import MockupArena from './components/MockupArena';
import AssetExporter from './components/AssetExporter';

// Hardcoded paths to our generated visual assets
const AI_LOGO_PATH = '/src/assets/images/biryani_logo_traditional_1783556264787.jpg';
const AI_MOCKUP_PATH = '/src/assets/images/biryani_packaging_mockup_1783556285514.jpg';

export default function App() {
  // Brand configuration state
  const [config, setConfig] = useState<LogoConfig>({
    textTop: 'Karachi Naseeb Biryani',
    textBottom: 'And Pulao Campus',
    textCenter: 'UCP',
    textEst: 'Est. 1998',
    primaryColor: '#f17829', // Saffron
    secondaryColor: '#e2ab22', // Royal Gold
    accentColor: '#c51d24', // Fiery Red
    textColor: '#ffffff',
    badgeStyle: 'circle',
    iconType: 'rice',
    borderStyle: 'double',
    fontStyle: 'serif'
  });

  // Editor interface states
  const [activeTab, setActiveTab] = useState<'palette' | 'typography' | 'mockups' | 'export'>('mockups');
  const [bgStyle, setBgStyle] = useState<'light' | 'dark' | 'transparent' | 'saffron'>('light');
  const [previewSize, setPreviewSize] = useState<number>(310);

  // Preset Palettes
  const PRESETS = [
    {
      name: 'Classic Saffron & Gold',
      primary: '#f17829',
      secondary: '#e2ab22',
      accent: '#c51d24',
      description: 'The iconic street food pairing'
    },
    {
      name: 'Fiery Royal Red',
      primary: '#c51d24',
      secondary: '#e2ab22',
      accent: '#14532d',
      description: 'Hot, spicy & halal credentials'
    },
    {
      name: 'Traditional Peshawari Saffron',
      primary: '#f17829',
      secondary: '#14532d',
      accent: '#2c1a11',
      description: 'Herbaceous spices and slow clay-cooking'
    },
    {
      name: 'Modern Charcoal Dark',
      primary: '#2c1a11',
      secondary: '#e2ab22',
      accent: '#f17829',
      description: 'Contemporary midnight street vibe'
    }
  ];

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }));
  };

  const handleReset = () => {
    setConfig({
      textTop: 'Karachi Naseeb Biryani',
      textBottom: 'And Pulao Campus',
      textCenter: 'UCP',
      textEst: 'Est. 1998',
      primaryColor: '#f17829',
      secondaryColor: '#e2ab22',
      accentColor: '#c51d24',
      textColor: '#ffffff',
      badgeStyle: 'circle',
      iconType: 'rice',
      borderStyle: 'double',
      fontStyle: 'serif'
    });
  };

  // Get background color class based on state
  const getPreviewBgClass = () => {
    switch (bgStyle) {
      case 'dark':
        return 'bg-brand-charcoal text-white pattern-dark';
      case 'transparent':
        return 'bg-linear-to-br from-gray-100 to-gray-200 checkerboard';
      case 'saffron':
        return 'brand-gradient-saffron text-white';
      case 'light':
      default:
        return 'bg-white shadow-inner';
    }
  };

  return (
    <div id="app-root-container" class="min-h-screen bg-[#faf8f5] flex flex-col justify-between">
      
      {/* 1. Header Hero section */}
      <header class="relative overflow-hidden border-b border-gray-100 bg-white">
        {/* Decorative ambient lights */}
        <div class="absolute top-0 right-0 w-96 h-96 brand-radial-glow pointer-events-none" />
        
        <div class="max-w-7xl mx-auto px-6 py-6 sm:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand-saffron/10 text-brand-saffron rounded-full text-xs font-bold tracking-wider uppercase">
              <Sparkles size={14} />
              <span>Official Branding & Identity Hub</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl font-serif font-black tracking-tight text-brand-charcoal leading-tight">
              Karachi Naseeb Biryani <span class="text-brand-saffron">& Pulao</span> <span class="text-brand-red">UCP</span>
            </h1>
            <p class="text-sm text-gray-500 max-w-2xl font-sans">
              Designed for digital dominance, this brand kit marries traditional Pakistani culinary graphics with bold, vibrant colors. Customize and showcase your app and web logo in real-time.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              id="reset-brand-config-btn"
              onClick={handleReset}
              class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <RotateCcw size={15} />
              <span>Reset Brand Specs</span>
            </button>
            <a
              id="external-link-ucp-group"
              href="https://ais-dev-qekdvbi7zgmlsezpzuias6-137186257324.asia-east1.run.app"
              target="_blank"
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white brand-gradient-saffron hover:opacity-95 transition-all shadow-md w-full sm:w-auto"
            >
              <ShoppingBag size={15} />
              <span>View Live App</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main class="max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* LEFT COLUMN: BRANDING CONTROLS & EDITOR (5 cols on lg) */}
        <section class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
            
            {/* Panel Title */}
            <div class="flex items-center gap-2.5 border-b border-gray-50 pb-4">
              <div class="p-2 bg-brand-saffron/10 text-brand-saffron rounded-lg">
                <Sliders size={18} />
              </div>
              <div>
                <h2 class="font-black text-lg text-brand-charcoal font-sans tracking-tight">Identity Customizer</h2>
                <p class="text-[11px] text-gray-400 uppercase tracking-widest font-mono font-semibold">Fine-tune traditional details</p>
              </div>
            </div>

            {/* A. TEXT INPUTS */}
            <div class="space-y-4">
              <h3 class="text-xs font-black uppercase tracking-wider text-brand-saffron flex items-center gap-1.5">
                <Type size={14} />
                <span>Brand Typography Texts</span>
              </h3>

              <div class="grid grid-cols-1 gap-3.5">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Curved Text</label>
                  <input
                    id="input-text-top"
                    type="text"
                    maxLength={30}
                    value={config.textTop}
                    onChange={(e) => setConfig({ ...config, textTop: e.target.value })}
                    class="w-full px-3.5 py-2.5 bg-brand-cream/50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-saffron transition-all text-brand-charcoal font-medium"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bottom Curved Text</label>
                  <input
                    id="input-text-bottom"
                    type="text"
                    maxLength={30}
                    value={config.textBottom}
                    onChange={(e) => setConfig({ ...config, textBottom: e.target.value })}
                    class="w-full px-3.5 py-2.5 bg-brand-cream/50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-saffron transition-all text-brand-charcoal font-medium"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Center Badge</label>
                    <input
                      id="input-text-center"
                      type="text"
                      maxLength={6}
                      value={config.textCenter}
                      onChange={(e) => setConfig({ ...config, textCenter: e.target.value })}
                      class="w-full px-3.5 py-2.5 bg-brand-cream/50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-saffron transition-all text-brand-charcoal font-bold text-center"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Established Year</label>
                    <input
                      id="input-text-est"
                      type="text"
                      maxLength={12}
                      value={config.textEst}
                      onChange={(e) => setConfig({ ...config, textEst: e.target.value })}
                      class="w-full px-3.5 py-2.5 bg-brand-cream/50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-saffron transition-all text-brand-charcoal font-medium text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* B. THEMATIC PRESET SELECTION */}
            <div class="space-y-3 pt-2">
              <h3 class="text-xs font-black uppercase tracking-wider text-brand-saffron flex items-center gap-1.5">
                <Palette size={14} />
                <span>Quick Vibrant Palettes</span>
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => {
                  const isActive =
                    config.primaryColor === p.primary &&
                    config.secondaryColor === p.secondary &&
                    config.accentColor === p.accent;
                  return (
                    <button
                      id={`preset-btn-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      class={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                        isActive ? 'border-brand-saffron bg-brand-saffron/5 ring-1 ring-brand-saffron' : 'border-gray-100 bg-[#faf8f5] hover:bg-white'
                      }`}
                    >
                      <div class="flex items-center gap-1">
                        <span class="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: p.primary }} />
                        <span class="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: p.secondary }} />
                        <span class="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: p.accent }} />
                        <span class="font-bold text-brand-charcoal ml-1">{p.name.split(' ')[0]}</span>
                      </div>
                      <span class="text-[10px] text-gray-500 leading-tight">{p.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* C. INDIVIDUAL COLOR CHANNELS */}
            <div class="space-y-4 pt-2">
              <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Custom Color Mix</span>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Saffron (Primary)</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      id="color-primary-picker"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      class="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <span class="font-mono text-[10px] text-gray-500 uppercase">{config.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gold (Secondary)</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      id="color-secondary-picker"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      class="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <span class="font-mono text-[10px] text-gray-500 uppercase">{config.secondaryColor}</span>
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Spice (Accent)</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      id="color-accent-picker"
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      class="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <span class="font-mono text-[10px] text-gray-500 uppercase">{config.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* D. TRADITIONAL SHAPES & BADGE STYLE */}
            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Badge Crest Shape</label>
                <select
                  id="select-badge-style"
                  value={config.badgeStyle}
                  onChange={(e) => setConfig({ ...config, badgeStyle: e.target.value as any })}
                  class="w-full px-3 py-2 bg-brand-cream/50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-saffron font-bold text-brand-charcoal"
                >
                  <option value="circle">Traditional Circle</option>
                  <option value="shield">Royal Shield</option>
                  <option value="starburst">Vintage Stamp</option>
                  <option value="hexagon">Modern Hexagon</option>
                  <option value="crest">Architectural Crest</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Center Symbol</label>
                <select
                  id="select-icon-type"
                  value={config.iconType}
                  onChange={(e) => setConfig({ ...config, iconType: e.target.value as any })}
                  class="w-full px-3 py-2 bg-brand-cream/50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-saffron font-bold text-brand-charcoal"
                >
                  <option value="rice">Steaming Rice Bowl</option>
                  <option value="handi">Traditional Clay Pot</option>
                  <option value="drumstick">Golden Chicken Leg</option>
                  <option value="chili">Crossing Hot Chillies</option>
                  <option value="crown">Royal Golden Crown</option>
                </select>
              </div>
            </div>

            {/* E. BORDERS & TYPOGRAPHY STYLE */}
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ring Border Style</label>
                <select
                  id="select-border-style"
                  value={config.borderStyle}
                  onChange={(e) => setConfig({ ...config, borderStyle: e.target.value as any })}
                  class="w-full px-3 py-2 bg-brand-cream/50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-saffron font-bold text-brand-charcoal"
                >
                  <option value="solid">Simple Solid</option>
                  <option value="double">Premium Double</option>
                  <option value="dotted">Traditional Bead Dot</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Typography Tone</label>
                <select
                  id="select-font-style"
                  value={config.fontStyle}
                  onChange={(e) => setConfig({ ...config, fontStyle: e.target.value as any })}
                  class="w-full px-3 py-2 bg-brand-cream/50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-saffron font-bold text-brand-charcoal"
                >
                  <option value="serif">Mughlai Display Serif</option>
                  <option value="sans">Modern App Sans</option>
                  <option value="traditional">Traditional Kufic Art</option>
                </select>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW & DESIGN WORKSPACE (7 cols on lg) */}
        <section class="lg:col-span-7 space-y-6">
          <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
            
            {/* Header section with toggles */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-brand-saffron uppercase tracking-widest font-mono">Live Interactive Canvas</span>
                <h2 class="font-black text-lg text-brand-charcoal tracking-tight">Active Vector Preview</h2>
              </div>

              {/* Background style toggle */}
              <div class="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                <button
                  id="preview-bg-light"
                  onClick={() => setBgStyle('light')}
                  class={`px-2.5 py-1 rounded-md transition-colors ${bgStyle === 'light' ? 'bg-white text-brand-charcoal shadow-xs' : 'text-gray-500 hover:text-brand-charcoal'}`}
                >
                  Light
                </button>
                <button
                  id="preview-bg-dark"
                  onClick={() => setBgStyle('dark')}
                  class={`px-2.5 py-1 rounded-md transition-colors ${bgStyle === 'dark' ? 'bg-white text-brand-charcoal shadow-xs' : 'text-gray-500 hover:text-brand-charcoal'}`}
                >
                  Dark
                </button>
                <button
                  id="preview-bg-saffron"
                  onClick={() => setBgStyle('saffron')}
                  class={`px-2.5 py-1 rounded-md transition-colors ${bgStyle === 'saffron' ? 'bg-white text-brand-charcoal shadow-xs' : 'text-gray-500 hover:text-brand-charcoal'}`}
                >
                  Saffron
                </button>
                <button
                  id="preview-bg-transparent"
                  onClick={() => setBgStyle('transparent')}
                  class={`px-2.5 py-1 rounded-md transition-colors ${bgStyle === 'transparent' ? 'bg-white text-brand-charcoal shadow-xs' : 'text-gray-500 hover:text-brand-charcoal'}`}
                >
                  Grid
                </button>
              </div>
            </div>

            {/* Central Render Box */}
            <div class="flex flex-col items-center justify-center space-y-6">
              <div
                class={`w-full min-h-[360px] rounded-2xl flex items-center justify-center p-6 transition-all duration-300 relative overflow-hidden ${getPreviewBgClass()}`}
              >
                {/* Embedded dynamic logo component */}
                <VectorLogo
                  id="interactive-brand-logo"
                  config={config}
                  size={previewSize}
                  className="transition-transform duration-300 transform hover:scale-[1.02]"
                />
              </div>

              {/* Slider for preview size */}
              <div class="w-full flex items-center justify-between gap-4 text-xs">
                <div class="flex items-center gap-1.5 text-gray-500">
                  <span class="font-bold">Logo Scale:</span>
                  <span class="font-mono bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold">{previewSize}px</span>
                </div>
                <input
                  id="logo-size-slider"
                  type="range"
                  min="220"
                  max="380"
                  step="10"
                  value={previewSize}
                  onChange={(e) => setPreviewSize(Number(e.target.value))}
                  class="flex-1 max-w-xs accent-brand-saffron h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* 3. Tabbed Brand Arena Navigation & Guidelines */}
      <section class="max-w-7xl w-full mx-auto px-6 pb-12 space-y-8">
        
        {/* Navigation Tabs */}
        <div class="border-b border-gray-200">
          <nav class="flex flex-wrap -mb-px gap-6 text-sm font-bold uppercase tracking-wider text-gray-500">
            <button
              id="tab-btn-mockups"
              onClick={() => setActiveTab('mockups')}
              class={`pb-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'mockups' ? 'border-brand-saffron text-brand-saffron' : 'border-transparent hover:text-brand-charcoal'
              }`}
            >
              <Eye size={16} />
              <span>Identity Mockup Arena</span>
            </button>
            <button
              id="tab-btn-palette"
              onClick={() => setActiveTab('palette')}
              class={`pb-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'palette' ? 'border-brand-saffron text-brand-saffron' : 'border-transparent hover:text-brand-charcoal'
              }`}
            >
              <Palette size={16} />
              <span>Full Color Guidelines</span>
            </button>
            <button
              id="tab-btn-typography"
              onClick={() => setActiveTab('typography')}
              class={`pb-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'typography' ? 'border-brand-saffron text-brand-saffron' : 'border-transparent hover:text-brand-charcoal'
              }`}
            >
              <Type size={16} />
              <span>Traditional Typography</span>
            </button>
            <button
              id="tab-btn-export"
              onClick={() => setActiveTab('export')}
              class={`pb-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'export' ? 'border-brand-saffron text-brand-saffron' : 'border-transparent hover:text-brand-charcoal'
              }`}
            >
              <Share2 size={16} />
              <span>Web Code Export</span>
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs transition-all duration-300">
          {activeTab === 'mockups' && (
            <MockupArena
              config={config}
              aiLogoPath={AI_LOGO_PATH}
              aiMockupPath={AI_MOCKUP_PATH}
            />
          )}

          {activeTab === 'palette' && (
            <ColorPalette
              primary={config.primaryColor}
              secondary={config.secondaryColor}
              accent={config.accentColor}
            />
          )}

          {activeTab === 'typography' && (
            <BrandTypographyShowcase />
          )}

          {activeTab === 'export' && (
            <AssetExporter config={config} />
          )}
        </div>

      </section>

      {/* 4. Footer */}
      <footer class="bg-brand-charcoal text-gray-400 py-10 border-t border-gray-800 text-xs text-center mt-auto">
        <div class="max-w-7xl mx-auto px-6 space-y-4">
          <div class="flex justify-center items-center gap-3">
            <VectorLogo config={config} size={40} />
            <span class="text-sm font-serif font-black tracking-widest text-white uppercase">
              Karachi Naseeb Biryani And Pulao ucp
            </span>
          </div>
          <p class="max-w-md mx-auto text-[11px] leading-relaxed opacity-85">
            This branding portal offers a fully scalable SVG logo customizer and high-definition generative branding showcases to jumpstart app development right outside UCP.
          </p>
          <div class="pt-4 border-t border-gray-800/60 max-w-xs mx-auto flex justify-between text-[10px] font-mono font-semibold">
            <span>UCP LAHORE, PAKISTAN</span>
            <span>© 2026 BRAND KIT HUB</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
