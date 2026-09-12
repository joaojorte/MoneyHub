/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#060911',       // Deep Space Navy puro
        space: {
          950: '#050811',
          900: '#080D1B',
          850: '#0C1326',
          800: '#111A33',
        },
        surface: {
          base: 'rgba(255, 255, 255, 0.02)',
          card: 'rgba(12, 19, 38, 0.55)',
          inset: 'rgba(4, 7, 15, 0.65)',
          active: 'rgba(255, 255, 255, 0.06)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.07)',
          light: 'rgba(255, 255, 255, 0.12)',
          hover: 'rgba(255, 255, 255, 0.18)',
          focus: 'rgba(255, 255, 255, 0.30)',
        },
        income: {
          DEFAULT: '#10B981',         // Verde-menta vibrante
          bright: '#34D399',          // Menta luminescente
          dim: 'rgba(16, 185, 129, 0.15)',
        },
        expense: {
          DEFAULT: '#F43F5E',         // Coral / Rose Neon
          bright: '#FB7185',          // Coral luminescente
          dim: 'rgba(244, 63, 94, 0.15)',
        },
        brand: {
          gold: '#F59E0B',
          goldBright: '#FBBF24',
          cyan: '#38BDF8',
          cyanBright: '#7DD3FC',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass-panel': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 12px 32px -4px rgba(0, 0, 0, 0.5)',
        'glass-input': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 1px 0 0 rgba(255, 255, 255, 0.04)',
        'glow-income': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-expense': '0 0 24px -4px rgba(244, 63, 94, 0.35)',
        'glow-brand': '0 0 24px -4px rgba(245, 158, 11, 0.35)',
        'glow-cyan': '0 0 24px -4px rgba(56, 189, 248, 0.35)',
      }
    },
  },
  plugins: [],
};
