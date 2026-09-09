import React from 'react';
import { Sliders, Eye, Code2, Layers, Check, Sparkles, RefreshCw, SunMedium } from 'lucide-react';

/**
 * BackgroundControlsBar Component
 * Allows live tweaking of background properties (Leaves toggle, Framing toggle, Blur strength, Center Translucency opacity)
 * and code inspection.
 */
export const BackgroundControlsBar = ({
  showLeaves,
  setShowLeaves,
  showFraming,
  setShowFraming,
  showBranding,
  setShowBranding,
  blurAmount,
  setBlurAmount,
  centerOpacity,
  setCenterOpacity,
  showGuides,
  setShowGuides,
  onOpenCode
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[92%] sm:w-auto bg-white/90 backdrop-blur-xl border border-white/90 shadow-2xl rounded-2xl p-3 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-agro-dark">
      
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <div className="w-8 h-8 rounded-xl bg-agro-forest text-white flex items-center justify-center shadow-xs">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <span className="block font-bold text-agro-dark">Background Controls</span>
          <span className="text-[10px] text-gray-500 font-normal">Live Customizer</span>
        </div>
      </div>

      {/* TOGGLE SWITCHES */}
      <div className="flex flex-wrap items-center gap-3">
        {/* LEAVES TOGGLE */}
        <button
          onClick={() => setShowLeaves(!showLeaves)}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all ${
            showLeaves 
              ? 'bg-agro-pale text-agro-dark border-agro-mint' 
              : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showLeaves ? 'bg-agro-forest' : 'bg-gray-300'}`} />
          <span>Hanging Leaves</span>
        </button>

        {/* FRAMING TOGGLE */}
        <button
          onClick={() => setShowFraming(!showFraming)}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all ${
            showFraming 
              ? 'bg-agro-pale text-agro-dark border-agro-mint' 
              : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showFraming ? 'bg-agro-forest' : 'bg-gray-300'}`} />
          <span>Nature Framing</span>
        </button>

        {/* BRANDING TOGGLE */}
        <button
          onClick={() => setShowBranding(!showBranding)}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all ${
            showBranding 
              ? 'bg-agro-pale text-agro-dark border-agro-mint' 
              : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showBranding ? 'bg-agro-forest' : 'bg-gray-300'}`} />
          <span>Left Branding</span>
        </button>

        {/* GUIDES TOGGLE */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all ${
            showGuides 
              ? 'bg-agro-sky text-sky-800 border-sky-300' 
              : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showGuides ? 'bg-sky-600' : 'bg-gray-300'}`} />
          <span>Canvas Guides</span>
        </button>
      </div>

      {/* SLIDERS FOR BLUR & OPACITY */}
      <div className="hidden lg:flex items-center gap-4 border-l border-gray-200 pl-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">Blur:</span>
          <input 
            type="range" 
            min="0" 
            max="30" 
            value={blurAmount} 
            onChange={(e) => setBlurAmount(Number(e.target.value))}
            className="w-16 accent-agro-forest cursor-pointer"
          />
          <span className="text-[11px] w-6 font-mono text-gray-600">{blurAmount}px</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">Opacity:</span>
          <input 
            type="range" 
            min="0.4" 
            max="1" 
            step="0.05"
            value={centerOpacity} 
            onChange={(e) => setCenterOpacity(Number(e.target.value))}
            className="w-16 accent-agro-forest cursor-pointer"
          />
          <span className="text-[11px] w-8 font-mono text-gray-600">{Math.round(centerOpacity * 100)}%</span>
        </div>
      </div>

      {/* ACTION BUTTON: GET CODE */}
      <button
        onClick={onOpenCode}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-agro-dark via-agro-forest to-agro-leaf text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <Code2 className="w-4 h-4" />
        <span>Get Code</span>
      </button>
    </div>
  );
};
