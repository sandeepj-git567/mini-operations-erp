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
        dark: {
          bg: '#070a12',
          surface: '#0f172a',
          card: 'rgba(15, 23, 42, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
          cyan: '#38bdf8',
          indigo: '#818cf8',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#f87171',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#38bdf8',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(56, 189, 248, 0.25)',
        'glow-emerald': '0 0 25px rgba(52, 211, 153, 0.25)',
        'glow-purple': '0 0 25px rgba(129, 140, 248, 0.25)',
      }
    },
  },
  plugins: [],
}
