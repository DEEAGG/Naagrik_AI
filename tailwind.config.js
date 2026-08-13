/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090d',
          900: '#0b0e14',
          800: '#11151f',
          700: '#1a2030',
          600: '#272f44',
        },
        accent: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3cdff',
          300: '#7fa9ff',
          400: '#4d86ff',
          500: '#2563eb',
          600: '#1d4fd0',
          700: '#1a3fa8',
          800: '#1a357f',
          900: '#192d5e',
        },
        cyanx: {
          400: '#5ad8e6',
          500: '#2cc3d4',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        pending: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        urgent: {
          400: '#f87171',
          500: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(77,134,255,0.25), 0 0 40px -8px rgba(77,134,255,0.45)',
        'glow-soft': '0 0 60px -20px rgba(77,134,255,0.55)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'breathe': 'breathe 3.6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.8s ease-in-out infinite',
        'drift': 'drift 28s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-40px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
