import { useState } from 'react';
import { Copy, Check, Code, FileCode, Download, ExternalLink } from 'lucide-react';
import { LogoConfig } from '../types';

interface AssetExporterProps {
  config: LogoConfig;
}

export default function AssetExporter({ config }: AssetExporterProps) {
  const [copiedText, setCopiedText] = useState<'svg' | 'react' | null>(null);

  // Generate SVG string representation based on config to let them download/copy!
  const getSvgCodeString = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <path id="top-text-path" d="M 55,200 A 145,145 0 0,1 345,200" fill="none" />
    <path id="bottom-text-path" d="M 64,208 A 136,136 0 0,0 336,208" fill="none" />
    <filter id="premium-shadow">
      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="${config.accentColor}" floodOpacity="0.15" />
    </filter>
  </defs>
  <g filter="url(#premium-shadow)">
    <!-- Outer Badge Ring -->
    <circle cx="200" cy="200" r="180" fill="#ffffff" stroke="${config.primaryColor}" stroke-width="6" />
    <circle cx="200" cy="200" r="168" fill="none" stroke="${config.accentColor}" stroke-width="2.5" />
    
    <!-- Top Curved Text -->
    <text font-family="system-ui, sans-serif" font-weight="900" letter-spacing="0.16em" fill="${config.primaryColor}" font-size="15.5">
      <textPath href="#top-text-path" startOffset="50%" text-anchor="middle">${config.textTop}</textPath>
    </text>
    
    <!-- Bottom Curved Text -->
    <text font-family="system-ui, sans-serif" font-weight="900" letter-spacing="0.18em" fill="${config.accentColor}" font-size="14">
      <textPath href="#bottom-text-path" startOffset="50%" text-anchor="middle" dy="5">${config.textBottom}</textPath>
    </text>
    
    <!-- Center White Disc -->
    <circle cx="200" cy="200" r="75" fill="#ffffff" stroke="${config.secondaryColor}" stroke-width="2" />
    <circle cx="200" cy="200" r="70" fill="none" stroke="${config.primaryColor}" stroke-width="1" stroke-dasharray="3,3" />
    
    <!-- Center Icon Symbol (e.g. Rice/Handi Bowl) -->
    <circle cx="200" cy="180" r="24" fill="${config.secondaryColor}20" stroke="${config.primaryColor}" stroke-width="3" />
    
    <!-- Ribbon Name Badge -->
    <path d="M 150,242 L 250,242 L 242,264 L 158,264 Z" fill="${config.accentColor}" />
    <text font-family="system-ui, sans-serif" font-weight="900" fill="#ffffff" font-size="15" text-anchor="middle" x="200" y="258">${config.textCenter}</text>
  </g>
</svg>`;
  };

  const getReactCodeString = () => {
    return `import React from 'react';

export function KarachiNaseebLogo() {
  return (
    <svg viewBox="0 0 400 400" className="w-48 h-48 select-none">
      <defs>
        <path id="top-path" d="M 55,200 A 145,145 0 0,1 345,200" fill="none" />
        <path id="bottom-path" d="M 64,208 A 136,136 0 0,0 336,208" fill="none" />
      </defs>
      <circle cx="200" cy="200" r="180" fill="none" stroke="${config.primaryColor}" strokeWidth="6" />
      <circle cx="200" cy="200" r="168" fill="none" stroke="${config.accentColor}" strokeWidth="2.5" />
      <text className="font-bold fill-[${config.primaryColor}]" fontSize="15">
        <textPath href="#top-path" startOffset="50%" textAnchor="middle">${config.textTop}</textPath>
      </text>
      <text className="font-bold fill-[${config.accentColor}]" fontSize="14">
        <textPath href="#bottom-path" startOffset="50%" textAnchor="middle">${config.textBottom}</textPath>
      </text>
      <circle cx="200" cy="200" r="75" fill="white" stroke="${config.secondaryColor}" strokeWidth="2" />
      <path d="M 150,242 L 250,242 L 242,264 L 158,264 Z" fill="${config.accentColor}" />
      <text fill="white" fontSize="14" textAnchor="middle" x="200" y="258">${config.textCenter}</text>
    </svg>
  );
}`;
  };

  const copyCode = (type: 'svg' | 'react', code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Download SVG file
  const downloadSvgFile = () => {
    const element = document.createElement("a");
    const file = new Blob([getSvgCodeString()], {type: 'image/svg+xml'});
    element.href = URL.createObjectURL(file);
    element.download = "karachi-naseeb-biryani-logo.svg";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="asset-exporter-section" class="space-y-6">
      <div class="space-y-2">
        <h3 class="text-xl font-bold font-sans tracking-tight text-brand-charcoal">Web Code & Asset Exporter</h3>
        <p class="text-sm text-gray-600">
          Ready-to-use vector assets and React templates. Get sharp, pixel-perfect rendering at any size.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Exporter */}
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-brand-saffron/10 rounded-lg text-brand-saffron">
                  <FileCode size={18} />
                </div>
                <span class="font-bold text-sm text-brand-charcoal">Clean SVG Code</span>
              </div>
              <div class="flex gap-2">
                <button
                  id="btn-copy-svg"
                  onClick={() => copyCode('svg', getSvgCodeString())}
                  class="p-2 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                >
                  {copiedText === 'svg' ? <Check size={14} class="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedText === 'svg' ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  id="btn-download-svg"
                  onClick={downloadSvgFile}
                  class="p-2 text-xs font-semibold rounded-lg bg-brand-saffron hover:bg-brand-saffron/90 text-white transition-colors flex items-center gap-1"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre class="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-48 leading-relaxed scrollbar-thin">
              {getSvgCodeString()}
            </pre>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-50 text-[11px] text-gray-500">
            Perfect for direct inline embedding inside responsive HTML pages, preventing fuzzy logo artifacts on 4K displays.
          </div>
        </div>

        {/* React Code Component */}
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-brand-saffron/10 rounded-lg text-brand-saffron">
                  <Code size={18} />
                </div>
                <span class="font-bold text-sm text-brand-charcoal">React Component (.tsx)</span>
              </div>
              <button
                id="btn-copy-react"
                onClick={() => copyCode('react', getReactCodeString())}
                class="p-2 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
              >
                {copiedText === 'react' ? <Check size={14} class="text-green-600" /> : <Copy size={14} />}
                <span>{copiedText === 'react' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <pre class="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-48 leading-relaxed scrollbar-thin">
              {getReactCodeString()}
            </pre>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-50 text-[11px] text-gray-500">
            Copy-paste this directly into your React/Next.js/Vite project files to enjoy dynamic coloring controls.
          </div>
        </div>
      </div>
    </div>
  );
}
