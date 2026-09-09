import React from 'react';
import { LayoutGrid, Sparkles, PlusCircle } from 'lucide-react';

/**
 * CenterDashboardPlaceholder Component
 * Fulfills Center Area & Layout Composition requirements:
 * Provides a clean, translucent soft white frosted glass container layer in the center
 * of the screen with backdrop blur for readability.
 * Strictly avoids rendering widgets, charts, or clutter as requested, but provides
 * a slot ({children}) for future dashboard layout integration.
 */
export const CenterDashboardPlaceholder = ({ 
  children,
  blurAmount = 16,
  opacityLevel = 0.85,
  showGuides = true
}) => {
  return (
    <div className="flex-1 flex flex-col h-full min-h-[550px] p-2 sm:p-4 lg:p-6 z-20 transition-all duration-300">
      {/* FROSTED GLASS CENTER CONTAINER */}
      <div 
        className="relative flex-1 w-full h-full rounded-3xl border border-white/80 shadow-agro-glass transition-all duration-300 overflow-hidden flex flex-col justify-between"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacityLevel})`,
          backdropFilter: `blur(${blurAmount}px)`,
          WebkitBackdropFilter: `blur(${blurAmount}px)`,
        }}
      >
        {/* SUBTLE GLOW OVERLAY IN CENTER */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-agro-pale/30 pointer-events-none" />

        {/* TOP FOUNDATION HEADER PLACEHOLDER BAR */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100/80 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-agro-pale text-agro-forest flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-agro-dark font-['Outfit']">AgroMart Dashboard Workspace</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-agro-forest bg-agro-pale rounded-full">
                  Foundation Layer
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Clean translucent canvas foundation ready for SaaS widgets & analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-gray-200/80 text-xs font-semibold text-gray-600">
              <Sparkles className="w-3.5 h-3.5 text-agro-fresh" />
              <span>Background Active</span>
            </div>
          </div>
        </div>

        {/* MAIN CANVAS / CONTENT SLOT */}
        <div className="relative z-10 flex-1 p-6 flex flex-col items-center justify-center text-center">
          {children ? (
            children
          ) : (
            <div className="max-w-md mx-auto space-y-4 p-8 rounded-2xl bg-white/40 border border-white/80 shadow-xs backdrop-blur-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-agro-pale to-white text-agro-forest flex items-center justify-center border border-agro-mint/40 shadow-sm">
                <LayoutGrid className="w-8 h-8 stroke-[1.8]" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-agro-dark font-['Outfit']">
                  Clean UI Canvas Ready
                </h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  This translucent frosted panel is optimized for optimal contrast and readability. Nature visuals framed along the edges remain visible without obstructing future dashboard cards.
                </p>
              </div>

              {showGuides && (
                <div className="pt-2 grid grid-cols-3 gap-2 text-left">
                  <div className="p-3 rounded-xl bg-white/60 border border-dashed border-agro-mint/60 text-center">
                    <span className="text-[10px] font-bold uppercase text-agro-forest block">Slot Left</span>
                    <span className="text-[11px] font-semibold text-gray-500">Future Nav/Filter</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 border border-dashed border-agro-mint/60 text-center">
                    <span className="text-[10px] font-bold uppercase text-agro-forest block">Slot Center</span>
                    <span className="text-[11px] font-semibold text-gray-500">Future Charts/Stats</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 border border-dashed border-agro-mint/60 text-center">
                    <span className="text-[10px] font-bold uppercase text-agro-forest block">Slot Right</span>
                    <span className="text-[11px] font-semibold text-gray-500">Future Feed/Map</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM STATUS FOOTER */}
        <div className="relative z-10 px-6 py-3 border-t border-gray-100/80 bg-white/30 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-agro-fresh" />
            <span>Smart AgroMart UI Foundation &bull; 100vh Responsive Layout</span>
          </div>
          <div className="hidden md:block text-[11px] text-agro-forest font-semibold">
            Fresh & Premium Agricultural Palette
          </div>
        </div>
      </div>
    </div>
  );
};
