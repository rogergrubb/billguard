import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f3',
          100: '#d6f1e1',
          200: '#b0e3c7',
          300: '#7dcfa6',
          400: '#4ab882',
          500: '#2a9d67',
          600: '#1d7f52',
          700: '#186644',
          800: '#165137',
          900: '#13432f',
          950: '#0a261a',
        },
        danger: {
          50: '#fef2f2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        slate: {
          850: '#172033',
          925: '#0d1520',
          950: '#080d16',
        }
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'count-up': 'countUp 1.5s ease-out forwards',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(300%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
