import React from 'react';

/**
 * FarmFramingSVG Component
 * Renders subtle nature-inspired framing, wheat/sprout stalks in bottom corners,
 * and soft horizon field outlines around the edges of the screen layout.
 */
export const FarmFramingSVG = ({ showFraming = true, opacity = 0.85 }) => {
  if (!showFraming) return null;

  return (
    <div 
      className="pointer-events-none absolute inset-0 overflow-hidden z-10 transition-opacity duration-500"
      style={{ opacity }}
    >
      {/* BOTTOM LEFT CROP & WHEAT STALKS */}
      <div className="absolute bottom-0 left-0 w-64 md:w-96 lg:w-[440px] opacity-90 filter drop-shadow-sm">
        <svg viewBox="0 0 450 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            <linearGradient id="stalkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1b4332" />
              <stop offset="60%" stopColor="#2d6a4f" />
              <stop offset="100%" stopColor="#52b788" />
            </linearGradient>
            <linearGradient id="wheatGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#2d6a4f" />
              <stop offset="50%" stopColor="#8d7b68" />
              <stop offset="100%" stopColor="#e9d8a6" />
            </linearGradient>
          </defs>

          {/* Earthy Ground Mound Base */}
          <path
            d="M -20 310 C 100 240, 260 250, 470 310 Z"
            fill="#1b4332"
            opacity="0.25"
          />
          <path
            d="M -10 310 C 120 255, 230 260, 390 310 Z"
            fill="#2d6a4f"
            opacity="0.3"
          />

          {/* Stalk 1 - Tall Sprout Left */}
          <path d="M 30 300 Q 60 180 90 90" stroke="url(#stalkGrad)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 90 90 C 70 80 50 100 40 120 C 60 110 80 100 90 90 Z" fill="#52b788" />
          <path d="M 90 90 C 110 80 130 100 140 120 C 120 110 100 100 90 90 Z" fill="#40916c" />

          {/* Stalk 2 - Wheat Grain Head */}
          <path d="M 90 300 Q 130 160 170 60" stroke="url(#wheatGrad)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Wheat grains */}
          {[
            { y: 60, scale: 1 },
            { y: 80, scale: 0.9 },
            { y: 100, scale: 0.8 },
            { y: 120, scale: 0.7 },
            { y: 140, scale: 0.6 }
          ].map((g, i) => (
            <g key={i} transform={`translate(${170 - (170 - 130) * (i / 5)}, ${g.y}) scale(${g.scale})`}>
              <ellipse cx="-8" cy="-5" rx="9" ry="5" fill="#e9d8a6" transform="rotate(-30)" />
              <ellipse cx="8" cy="-5" rx="9" ry="5" fill="#c2b280" transform="rotate(30)" />
            </g>
          ))}

          {/* Stalk 3 - Lush Sprout Mid */}
          <path d="M 160 300 Q 190 200 230 110" stroke="url(#stalkGrad)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 230 110 C 210 100 190 120 180 140 C 200 130 220 120 230 110 Z" fill="#74c69d" />
          <path d="M 230 110 C 250 100 270 120 280 140 C 260 130 240 120 230 110 Z" fill="#52b788" />

          {/* Stalk 4 - Low Wheat Accent */}
          <path d="M 240 300 Q 280 210 320 130" stroke="url(#wheatGrad)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* BOTTOM RIGHT CROP & FIELD SILHOUETTE */}
      <div className="absolute bottom-0 right-0 w-64 md:w-96 lg:w-[440px] opacity-90 filter drop-shadow-sm">
        <svg viewBox="0 0 450 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          {/* Earthy Ground Mound Base Right */}
          <path
            d="M -20 310 C 190 250, 350 240, 470 310 Z"
            fill="#1b4332"
            opacity="0.25"
          />
          <path
            d="M 60 310 C 220 260, 330 255, 460 310 Z"
            fill="#2d6a4f"
            opacity="0.3"
          />

          {/* Right Crop Stalk 1 */}
          <g transform="translate(450, 0) scale(-1, 1)">
            <path d="M 40 300 Q 70 170 110 80" stroke="url(#stalkGrad)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 110 80 C 90 70 70 90 60 110 C 80 100 100 90 110 80 Z" fill="#52b788" />
            <path d="M 110 80 C 130 70 150 90 160 110 C 140 100 120 90 110 80 Z" fill="#40916c" />

            <path d="M 110 300 Q 150 170 190 70" stroke="url(#wheatGrad)" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 190 300 Q 220 210 260 120" stroke="url(#stalkGrad)" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* SOFT VIGNETTE & CORNER OVERLAYS */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#1b4332]/5 pointer-events-none" />
    </div>
  );
};
