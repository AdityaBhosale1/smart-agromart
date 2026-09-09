import React from 'react';
import bgImage from '../assets/agromart_pure_bg.jpg';
import { LeafOverlaySVG } from './LeafOverlaySVG';
import { FarmFramingSVG } from './FarmFramingSVG';

/**
 * AgroMartBackgroundWrapper
 * 
 * Full-screen agricultural background wrapper with ZERO outer headers.
 * Provides padding around the centered floating dashboard container
 * so sky top, hanging leaves, and farm scenery are visible on all 4 edges.
 */
export const AgroMartBackgroundWrapper = ({
  children,
  showLeaves = true,
  showFraming = true,
  customBgImage = bgImage,
  centerGlowOpacity = 0.85
}) => {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#f4fbf7] text-gray-800 font-sans select-none flex items-center justify-center p-3 sm:p-5 lg:p-6">
      
      {/* ------------------------------------------------------------------ */}
      {/* 1. BRIGHT SKY & LIGHT GRADIENT TOP LAYER */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#e1f2f8] via-[#f4fbf7] to-[#e8f5ec] pointer-events-none z-0" />

      {/* SOFT AMBIENT SUNLIGHT FLARE (Top Center) */}
      <div className="fixed -top-36 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-amber-100/70 via-emerald-100/30 to-transparent rounded-full blur-3xl pointer-events-none z-0 animate-sun-glow" />

      {/* ------------------------------------------------------------------ */}
      {/* 2. SCENIC AGRICULTURAL LANDSCAPE BACKDROP */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-95 mix-blend-multiply z-0"
        style={{ backgroundImage: `url(${customBgImage})` }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* 3. SUBTLE WHITE TRANSPARENT RADIAL GRADIENT IN CENTER */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 46%, rgba(255, 255, 255, ${centerGlowOpacity}) 0%, rgba(255, 255, 255, ${centerGlowOpacity * 0.8}) 42%, rgba(255, 255, 255, 0.3) 72%, transparent 100%)`
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* 4. DECORATIVE HANGING GREEN LEAVES (Top Left & Right Corners) */}
      {/* ------------------------------------------------------------------ */}
      <LeafOverlaySVG showLeaves={showLeaves} opacity={1} />

      {/* ------------------------------------------------------------------ */}
      {/* 5. NATURE-INSPIRED FRAMING & WHEAT STALKS (Edges & Bottom) */}
      {/* ------------------------------------------------------------------ */}
      <FarmFramingSVG showFraming={showFraming} opacity={0.9} />

      {/* ------------------------------------------------------------------ */}
      {/* 6. CENTERED FLOATING CONTAINER SLOT (Single Dashboard App) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-30 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default AgroMartBackgroundWrapper;
