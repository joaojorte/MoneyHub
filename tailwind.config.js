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
        background: '#090D16',       // Deep Space Navy
        surface: {
          base: 'rgba(255, 255, 255, 0.03)',
          card: 'rgba(255, 255, 255, 0.05)',
          inset: 'rgba(0, 0, 0, 0.25)',
          active: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.14)',
          focus: 'rgba(255, 255, 255, 0.25)',
        },
        income: {
          DEFAULT: '#35C98A',         // Menta Elétrico
          dim: 'rgba(53, 201, 138, 0.15)',
        },
        expense: {
          DEFAULT: '#F43F5E',         // Coral / Rose Neon
          dim: 'rgba(244, 63, 94, 0.15)',
        },
        brand: {
          gold: '#F0B94A',
          cyan: '#38BDF8',
          purple: '#A78BFA',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glow-income': '0 0 20px -5px rgba(53, 201, 138, 0.3)',
        'glow-expense': '0 0 20px -5px rgba(244, 63, 94, 0.3)',
      }
    },
  },
  plugins: [],
};
