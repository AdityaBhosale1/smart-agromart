import React from 'react';
import { Sprout, ShieldCheck, Sun, Compass, Leaf, ArrowRight } from 'lucide-react';

/**
 * LeftBrandingArea Component
 * Fulfills Left Side Aesthetic requirement:
 * Provides space for motivational agriculture branding, logo, taglines,
 * and key feature highlights while preserving room for the central dashboard UI.
 */
export const LeftBrandingArea = ({ 
  showBranding = true,
  title = "Smart AgroMart",
  subtitle = "Empowering Next-Gen Precision Agriculture & Sustainable Farming"
}) => {
  if (!showBranding) return null;

  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col justify-between py-6 px-4 sm:px-6 lg:pl-8 lg:pr-2 z-20 select-none">
      {/* BRAND HEADER */}
      <div className="space-y-6">
        {/* LOGO BADGE */}
        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-sm transition-all hover:bg-white hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-agro-forest via-agro-leaf to-agro-fresh flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-agro-dark font-['Outfit']">
              {title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-agro-forest">
              <span className="w-2 h-2 rounded-full bg-agro-fresh animate-pulse" />
              <span>SaaS Platform</span>
            </div>
          </div>
        </div>

        {/* MOTIVATIONAL HEROTEXT / TAGLINE */}
        <div className="space-y-3 bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-agro-forest bg-agro-pale/90 px-3 py-1 rounded-full">
            <Leaf className="w-3.5 h-3.5" />
            <span>Sustainable Future</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-agro-dark leading-snug font-['Outfit']">
            Nurturing Soil, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-agro-forest via-agro-leaf to-agro-fresh">
              Growing Abundance.
            </span>
          </h2>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* MOTIVATIONAL PILLARS TICKER */}
        <div className="hidden sm:flex flex-col gap-2.5 pt-2">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/50 backdrop-blur-xs border border-white/60 text-xs font-semibold text-agro-dark">
            <div className="w-7 h-7 rounded-lg bg-agro-pale text-agro-forest flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <span>Optimized Sunlight & Weather Analytics</span>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/50 backdrop-blur-xs border border-white/60 text-xs font-semibold text-agro-dark">
            <div className="w-7 h-7 rounded-lg bg-agro-pale text-agro-forest flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Real-time Crop Health & Yield Security</span>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/50 backdrop-blur-xs border border-white/60 text-xs font-semibold text-agro-dark">
            <div className="w-7 h-7 rounded-lg bg-agro-pale text-agro-forest flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <span>Automated Field & Drone Irrigation</span>
          </div>
        </div>
      </div>

      {/* FOOTER MOTIVATIONAL QUOTE */}
      <div className="mt-8 hidden lg:block bg-gradient-to-br from-white/70 to-agro-pale/50 backdrop-blur-md p-4 rounded-2xl border border-white/70 shadow-xs">
        <p className="text-xs italic text-agro-dark/80 font-medium">
          "Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals, & happiness."
        </p>
        <div className="mt-2 text-[11px] font-bold text-agro-forest tracking-wide uppercase">
          — Smart AgroMart Ecosystem
        </div>
      </div>
    </div>
  );
};
