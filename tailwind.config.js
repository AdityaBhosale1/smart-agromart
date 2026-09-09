/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#1b4332',
          forest: '#2d6a4f',
          leaf: '#40916c',
          fresh: '#52b788',
          mint: '#74c69d',
          light: '#b7e4c7',
          pale: '#d8f3dc',
          cream: '#fdfbf7',
          sky: '#e8f4f8',
          earth: '#8d7b68',
          golden: '#e9d8a6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'agro-glass': '0 20px 50px rgba(27, 67, 50, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)',
        'agro-glow': '0 0 40px rgba(82, 183, 136, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
