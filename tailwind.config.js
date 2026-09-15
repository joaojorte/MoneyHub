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
        background: {
          light: '#F8FAFC',       // Cinza gelo / Slate 50
          dark: '#080D1A',        // Azul-noite profundo
        },
        surface: {
          light: '#FFFFFF',
          'light-subtle': '#F1F5F9',
          dark: '#0C1326',
          'dark-subtle': '#111A33',
        },
        income: {
          light: '#059669',       // Esmeralda 600 sóbrio
          DEFAULT: '#10B981',
          dark: '#34D399',        // Esmeralda 400
        },
        expense: {
          light: '#E11D48',       // Rose 600 sóbrio
          DEFAULT: '#F43F5E',
          dark: '#FB7185',        // Rose 400
        },
        brand: {
          gold: '#D97706',        // Âmbar 600 sóbrio
          goldDark: '#FBBF24',
          cyan: '#0284C7',
          cyanDark: '#38BDF8',
          purple: '#9333EA',
          purpleDark: '#C084FC',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass-panel': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 12px 32px -4px rgba(0, 0, 0, 0.5)',
        'glass-input': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 1px 0 0 rgba(255, 255, 255, 0.04)',
      }
    },
  },
  plugins: [],
};
