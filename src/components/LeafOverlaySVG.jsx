import React from 'react';

/**
 * Hanging Leaves Decorative Overlay Component
 * Renders lush, detailed agricultural leaves hanging from the top corners.
 * Includes natural drop-shadows and subtle organic breeze movement.
 */
export const LeafOverlaySVG = ({ showLeaves = true, opacity = 1 }) => {
  if (!showLeaves) return null;

  return (
    <div 
      className="pointer-events-none absolute inset-0 overflow-hidden z-20 transition-opacity duration-500"
      style={{ opacity }}
    >
      {/* TOP LEFT HANGING LEAF CLUSTER */}
      <div className="absolute -top-4 -left-6 w-72 md:w-96 lg:w-[480px] animate-leaf-left filter drop-shadow-md">
        <svg
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <defs>
            <linearGradient id="leafGradLeft1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1b4332" />
              <stop offset="50%" stopColor="#2d6a4f" />
              <stop offset="100%" stopColor="#40916c" />
            </linearGradient>
            <linearGradient id="leafGradLeft2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#40916c" />
              <stop offset="60%" stopColor="#52b788" />
              <stop offset="100%" stopColor="#74c69d" />
            </linearGradient>
            <linearGradient id="leafGradLeft3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d6a4f" />
              <stop offset="70%" stopColor="#40916c" />
              <stop offset="100%" stopColor="#95d5b2" />
            </linearGradient>
            <radialGradient id="sunHighlight" cx="20%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#d8f3dc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Main Vine Branches */}
          <path
            d="M -20 -10 C 120 20, 220 100, 310 170 C 340 195, 380 230, 420 250"
            stroke="#1b4332"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M -10 -20 C 150 70, 260 110, 360 140"
            stroke="#2d6a4f"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Leaf 1 - Deep Top Corner */}
          <g transform="translate(40, 20) rotate(25)">
            <path
              d="M0,0 C40,-30 110,-20 150,30 C110,60 40,50 0,0 Z"
              fill="url(#leafGradLeft1)"
            />
            <path d="M0,0 C60,-5 120,10 150,30" stroke="#74c69d" strokeWidth="2.5" opacity="0.7" />
          </g>

          {/* Leaf 2 - Hanging Down Mid Left */}
          <g transform="translate(140, 80) rotate(50)">
            <path
              d="M0,0 C50,-40 130,-30 180,40 C130,80 50,60 0,0 Z"
              fill="url(#leafGradLeft2)"
            />
            <path d="M0,0 C70,-10 140,15 180,40" stroke="#d8f3dc" strokeWidth="3" opacity="0.8" />
            {/* Leaf veins */}
            <path d="M40,5 Q70,-10 90,0 M80,18 Q110,0 130,15" stroke="#95d5b2" strokeWidth="1.5" opacity="0.6" />
          </g>

          {/* Leaf 3 - Fresh Highlight Leaf */}
          <g transform="translate(230, 140) rotate(35)">
            <path
              d="M0,0 C45,-35 115,-25 160,35 C115,70 45,55 0,0 Z"
              fill="url(#leafGradLeft3)"
            />
            <path d="M0,0 C60,-8 120,12 160,35" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
          </g>

          {/* Leaf 4 - Tip Leaf */}
          <g transform="translate(320, 190) rotate(65)">
            <path
              d="M0,0 C35,-25 90,-15 125,25 C90,50 35,40 0,0 Z"
              fill="url(#leafGradLeft2)"
            />
            <path d="M0,0 C45,-5 95,8 125,25" stroke="#d8f3dc" strokeWidth="2" opacity="0.9" />
          </g>

          {/* Small Accent Leaves */}
          <g transform="translate(90, 50) rotate(-15)">
            <path d="M0,0 C25,-20 65,-15 90,20 C65,35 25,30 0,0 Z" fill="#52b788" />
          </g>
          <g transform="translate(200, 40) rotate(10)">
            <path d="M0,0 C30,-20 70,-10 100,25 C70,40 30,30 0,0 Z" fill="#2d6a4f" />
          </g>
        </svg>
      </div>

      {/* TOP RIGHT HANGING LEAF CLUSTER */}
      <div className="absolute -top-4 -right-6 w-72 md:w-96 lg:w-[480px] animate-leaf-right filter drop-shadow-md">
        <svg
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <defs>
            <linearGradient id="leafGradRight1" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1b4332" />
              <stop offset="50%" stopColor="#2d6a4f" />
              <stop offset="100%" stopColor="#52b788" />
            </linearGradient>
            <linearGradient id="leafGradRight2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d6a4f" />
              <stop offset="60%" stopColor="#40916c" />
              <stop offset="100%" stopColor="#74c69d" />
            </linearGradient>
          </defs>

          {/* Main Vine Branches */}
          <path
            d="M 520 -10 C 380 30, 280 110, 190 180 C 160 205, 120 240, 80 260"
            stroke="#1b4332"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 510 -20 C 350 80, 240 120, 140 150"
            stroke="#2d6a4f"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Leaf 1 - Right Top Corner */}
          <g transform="translate(420, 30) scale(-1, 1) rotate(25)">
            <path
              d="M0,0 C40,-30 110,-20 150,30 C110,60 40,50 0,0 Z"
              fill="url(#leafGradRight1)"
            />
            <path d="M0,0 C60,-5 120,10 150,30" stroke="#74c69d" strokeWidth="2.5" opacity="0.7" />
          </g>

          {/* Leaf 2 - Mid Right Leaf */}
          <g transform="translate(320, 90) scale(-1, 1) rotate(45)">
            <path
              d="M0,0 C50,-40 130,-30 180,40 C130,80 50,60 0,0 Z"
              fill="url(#leafGradRight2)"
            />
            <path d="M0,0 C70,-10 140,15 180,40" stroke="#d8f3dc" strokeWidth="3" opacity="0.8" />
          </g>

          {/* Leaf 3 - Outer Fresh Leaf */}
          <g transform="translate(220, 150) scale(-1, 1) rotate(30)">
            <path
              d="M0,0 C45,-35 115,-25 160,35 C115,70 45,55 0,0 Z"
              fill="url(#leafGradRight1)"
            />
            <path d="M0,0 C60,-8 120,12 160,35" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
          </g>

          {/* Leaf 4 - Lower Tip Leaf */}
          <g transform="translate(130, 200) scale(-1, 1) rotate(60)">
            <path
              d="M0,0 C35,-25 90,-15 125,25 C90,50 35,40 0,0 Z"
              fill="url(#leafGradRight2)"
            />
            <path d="M0,0 C45,-5 95,8 125,25" stroke="#d8f3dc" strokeWidth="2" opacity="0.9" />
          </g>

          {/* Accent Leaves */}
          <g transform="translate(380, 60) scale(-1, 1) rotate(-10)">
            <path d="M0,0 C25,-20 65,-15 90,20 C65,35 25,30 0,0 Z" fill="#52b788" />
          </g>
        </svg>
      </div>
    </div>
  );
};
