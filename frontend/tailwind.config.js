/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050714',
          surface: '#0c102b',
          card: 'rgba(12, 16, 43, 0.85)',
          cyan: '#00f3ff',
          pink: '#ff0055',
          green: '#00ff66',
          yellow: '#ffaa00',
          purple: '#9d4edd',
        },
        brand: {
          50: '#e0f2fe',
          500: '#00f3ff',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c102b',
        }
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'cyber-glow': 'cyber-glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'cyber-glow': {
          '0%': { boxShadow: '0 0 15px rgba(0, 243, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 243, 255, 0.8), 0 0 50px rgba(255, 0, 85, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
