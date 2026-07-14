import { useState } from 'react';
import { Smartphone, Laptop, Sparkles, Tag, ShoppingBag, Eye } from 'lucide-react';
import { LogoConfig } from '../types';
import VectorLogo from './VectorLogo';

interface MockupArenaProps {
  config: LogoConfig;
  aiLogoPath: string;
  aiMockupPath: string;
}

export default function MockupArena({ config, aiLogoPath, aiMockupPath }: MockupArenaProps) {
  const [activeMock, setActiveMock] = useState<'mobile' | 'web' | 'packaging' | 'poster'>('mobile');
  const [showImageZoom, setShowImageZoom] = useState<string | null>(null);

  const {
    textTop,
    textBottom,
    textCenter,
    primaryColor,
    secondaryColor,
    accentColor
  } = config;

  return (
    <div id="mockup-arena-section" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold font-sans tracking-tight text-brand-charcoal">Real-World Application Mockups</h3>
          <p class="text-sm text-gray-600">
            Preview your dynamic logo and vibrant colors rendered in various mobile, web, and physical print formats.
          </p>
        </div>

        {/* Tab Selector */}
        <div class="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-xl max-w-max">
          <button
            id="tab-mobile"
            onClick={() => setActiveMock('mobile')}
            class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeMock === 'mobile' ? 'bg-white text-brand-saffron shadow-xs' : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            <Smartphone size={14} />
            <span>Mobile App</span>
          </button>
          <button
            id="tab-web"
            onClick={() => setActiveMock('web')}
            class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeMock === 'web' ? 'bg-white text-brand-saffron shadow-xs' : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            <Laptop size={14} />
            <span>Web App</span>
          </button>
          <button
            id="tab-packaging"
            onClick={() => setActiveMock('packaging')}
            class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeMock === 'packaging' ? 'bg-white text-brand-saffron shadow-xs' : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            <ShoppingBag size={14} />
            <span>AI Packaging</span>
          </button>
          <button
            id="tab-poster"
            onClick={() => setActiveMock('poster')}
            class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeMock === 'poster' ? 'bg-white text-brand-saffron shadow-xs' : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            <Tag size={14} />
            <span>Promo Poster</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mockup Preview Area */}
        <div class="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex justify-center items-center min-h-[460px] relative overflow-hidden">
          
          {/* Subtle grid background to look like a canvas */}
          <div class="absolute inset-0 bg-[radial-gradient(#f1782910_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* 1. Mobile App Splash Screen Mockup */}
          {activeMock === 'mobile' && (
            <div id="mockup-mobile-container" class="relative w-72 h-[420px] bg-[#121212] rounded-[36px] border-8 border-gray-800 shadow-2xl overflow-hidden flex flex-col justify-between p-6">
              {/* Speaker Notch */}
              <div class="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                <div class="w-12 h-1 bg-gray-900 rounded-full" />
              </div>

              {/* Top info */}
              <div class="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1">
                <span>05:15 PM</span>
                <div class="flex items-center gap-1">
                  <span>5G</span>
                  <div class="w-4 h-2.5 border border-gray-500 rounded-xs bg-gray-500" />
                </div>
              </div>

              {/* Splash content */}
              <div class="my-auto flex flex-col items-center text-center space-y-4">
                <div class="relative group">
                  {/* Outer glowing halo */}
                  <div class="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: primaryColor }} />
                  <VectorLogo config={config} size={150} className="relative transform hover:scale-105 transition-transform" />
                </div>
                
                <div class="space-y-1">
                  <h4 class="text-white text-lg font-bold font-serif tracking-wider" style={{ color: primaryColor }}>
                    {textTop}
                  </h4>
                  <p class="text-gray-400 text-xs tracking-widest font-sans uppercase">
                    {textBottom}
                  </p>
                </div>
              </div>

              {/* Loader */}
              <div class="flex flex-col items-center space-y-2 mb-2">
                <div class="flex gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full animate-bounce bg-brand-saffron" style={{ animationDelay: '0ms' }} />
                  <span class="w-2.5 h-2.5 rounded-full animate-bounce bg-brand-gold" style={{ animationDelay: '150ms' }} />
                  <span class="w-2.5 h-2.5 rounded-full animate-bounce bg-brand-red" style={{ animationDelay: '300ms' }} />
                </div>
                <span class="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-semibold">Slow cooking magic...</span>
              </div>
            </div>
          )}

          {/* 2. Web App Header / Navigation Preview */}
          {activeMock === 'web' && (
            <div id="mockup-web-container" class="w-full space-y-6">
              {/* Web Header */}
              <header class="w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <VectorLogo config={config} size={50} />
                  <div>
                    <h5 class="font-serif font-black text-sm tracking-wide leading-tight text-brand-charcoal">
                      {textTop.split(' ').slice(0, 2).join(' ')}
                    </h5>
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {textCenter || 'UCP'}
                    </p>
                  </div>
                </div>

                {/* Nav Links */}
                <nav class="hidden sm:flex items-center gap-5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <span class="text-brand-saffron hover:text-brand-saffron cursor-pointer">Menu</span>
                  <span class="hover:text-brand-saffron cursor-pointer">Our Outlets</span>
                  <span class="hover:text-brand-saffron cursor-pointer">Catering Deals</span>
                  <span class="hover:text-brand-saffron cursor-pointer">Reviews</span>
                </nav>

                {/* Action Button */}
                <button
                  class="px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: accentColor }}
                >
                  Order Online
                </button>
              </header>

              {/* Web Hero banner preview */}
              <div class="relative h-64 w-full rounded-2xl overflow-hidden brand-gradient-saffron flex items-center p-8 text-white">
                <div class="space-y-4 max-w-md z-10">
                  <div class="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles size={12} />
                    <span>UCP Lahore Student Special</span>
                  </div>
                  <h1 class="text-3xl font-serif font-black tracking-tight leading-tight">
                    Where Tradition Meets Naseeb.
                  </h1>
                  <p class="text-sm opacity-90 font-sans">
                    Freshly steamed golden basmati rice layered with juicy, highly spiced marinated chicken. Hot and fresh right outside UCP.
                  </p>
                  <div class="flex gap-3">
                    <button class="px-5 py-2.5 bg-brand-charcoal text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-charcoal/90 shadow-md">
                      View Menu
                    </button>
                    <button class="px-5 py-2.5 bg-white text-brand-saffron rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 shadow-md">
                      Order Now
                    </button>
                  </div>
                </div>
                {/* Abstract background graphics */}
                <div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: secondaryColor }} />
                <div class="absolute right-6 top-6 opacity-80 pointer-events-none">
                  <VectorLogo config={config} size={180} />
                </div>
              </div>
            </div>
          )}

          {/* 3. AI Packaging Presentation */}
          {activeMock === 'packaging' && (
            <div id="mockup-packaging-container" class="w-full flex flex-col items-center space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* AI Generated Mockup Frame */}
                <div class="relative group rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-[#faf8f5]">
                  <img
                    src={aiMockupPath}
                    alt="Karachi Naseeb Biryani Packaging Mockup"
                    class="w-full h-56 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setShowImageZoom(aiMockupPath)}
                      class="p-3 bg-white rounded-full shadow-lg text-brand-charcoal hover:scale-105 transition-transform flex items-center gap-1.5 text-xs font-bold uppercase"
                    >
                      <Eye size={16} />
                      <span>Zoom View</span>
                    </button>
                  </div>
                  <span class="absolute top-3 left-3 bg-brand-saffron text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    AI Packaging Mockup
                  </span>
                </div>

                {/* AI Generated Logo Icon Frame */}
                <div class="relative group rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white flex flex-col justify-between p-4">
                  <div class="flex items-center justify-between border-b border-gray-50 pb-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">AI Generated Logo</span>
                    <span class="text-[10px] bg-brand-gold/20 text-brand-saffron font-bold px-2 py-0.5 rounded-md">1:1 Premium</span>
                  </div>
                  <div class="my-auto flex justify-center items-center py-4">
                    <img
                      src={aiLogoPath}
                      alt="Traditional Biryani Logo"
                      class="w-36 h-36 object-contain rounded-2xl shadow-inner border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button
                    onClick={() => setShowImageZoom(aiLogoPath)}
                    class="w-full py-2 bg-brand-charcoal hover:bg-brand-charcoal/95 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={14} />
                    <span>Expand Design</span>
                  </button>
                </div>
              </div>

              {/* Informative packaging card */}
              <div class="w-full bg-[#faf8f5] p-4 rounded-xl border border-gray-100 text-xs flex gap-3 items-center">
                <div class="p-2.5 bg-brand-saffron/10 rounded-lg text-brand-saffron">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h6 class="font-bold text-brand-charcoal">Design Presentation Notes</h6>
                  <p class="text-gray-500 leading-relaxed">
                    The packaging represents premium, grease-resistant, hot-locking box liners designed for takeaway. The traditional circular badge sits dead-center to maximize brand recognition on delivery riders and campus tables.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Promotional Student Poster */}
          {activeMock === 'poster' && (
            <div id="mockup-poster-container" class="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              <div class="p-1 brand-gradient-saffron" />
              <div class="p-6 space-y-6">
                <div class="flex items-start justify-between">
                  <div class="space-y-1">
                    <span class="text-[10px] font-extrabold uppercase tracking-widest text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">
                      UCP Special Deal
                    </span>
                    <h4 class="text-xl font-serif font-black text-brand-charcoal tracking-tight">
                      Hot, Fresh & Traditional
                    </h4>
                  </div>
                  <VectorLogo config={config} size={70} />
                </div>

                <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-4">
                  <div class="text-center bg-brand-red text-white p-2.5 rounded-xl">
                    <span class="block text-xl font-serif font-black tracking-tight">20%</span>
                    <span class="block text-[9px] uppercase font-bold tracking-widest">OFF</span>
                  </div>
                  <div>
                    <h5 class="font-bold text-sm text-brand-charcoal">UCP Campus Student Discount</h5>
                    <p class="text-xs text-gray-500">Present your official UCP student ID card and claim delicious savings on any Biryani plate!</p>
                  </div>
                </div>

                <div class="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center text-xs">
                  <div>
                    <span class="block text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Location</span>
                    <span class="font-bold text-brand-charcoal">Directly Opposite UCP Main Gate</span>
                  </div>
                  <div class="text-right">
                    <span class="block text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Timing</span>
                    <span class="font-bold text-brand-charcoal">11:00 AM - 11:00 PM</span>
                  </div>
                </div>
              </div>
              <div class="bg-brand-charcoal py-3 px-6 text-center text-[10px] font-mono text-gray-400 tracking-wider">
                FOR BULK CATERING CONTACT: info@karachinaseeb-ucp.com
              </div>
            </div>
          )}
        </div>

        {/* Brand Specs Details Panel */}
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-5">
            <h4 class="font-bold font-sans text-brand-charcoal tracking-tight border-b border-gray-50 pb-3 flex items-center gap-1.5">
              <Sparkles size={16} class="text-brand-saffron" />
              <span>Identity Specs</span>
            </h4>

            <div class="space-y-4">
              <div class="space-y-1.5">
                <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">App Icon Preview</span>
                <div class="flex items-center gap-3">
                  {/* Square App Icon */}
                  <div class="w-16 h-16 rounded-2xl bg-brand-charcoal flex items-center justify-center shadow-md border border-brand-charcoal relative overflow-hidden group">
                    <div class="absolute inset-0 bg-radial-glow opacity-50" />
                    <VectorLogo config={config} size={60} className="relative transform group-hover:scale-105 transition-transform" />
                  </div>
                  {/* Round App Icon */}
                  <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100 relative overflow-hidden group">
                    <VectorLogo config={config} size={64} className="relative transform group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <span class="block text-xs font-bold text-brand-charcoal">Standard Formats</span>
                    <span class="block text-[10px] text-gray-500">Android squircle & iOS circles are fully compliant.</span>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Design Language</span>
                <p class="text-xs text-gray-600 leading-relaxed">
                  Combining <strong>vibrant saffron and gold gradients</strong> with classical geometric arches from historical Pakistani culinary artwork, crafting a high-recalled presence for food delivery applications.
                </p>
              </div>

              <div class="space-y-1">
                <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Traditional Slogans</span>
                <div class="bg-[#faf8f5] p-2.5 rounded-xl border border-gray-100 text-xs font-serif italic text-gray-600">
                  "Naseeb Se Milti Hai Khushboo Aur Swaad"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal for Full Image View */}
      {showImageZoom && (
        <div class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <button
            onClick={() => setShowImageZoom(null)}
            class="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ✕
          </button>
          <img
            src={showImageZoom}
            alt="Expanded Brand Asset"
            class="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}
