import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variables — light/dark modada avtomatik o'zgaradi
        ink:    'rgb(var(--c-ink)    / <alpha-value>)',
        panel:  'rgb(var(--c-panel)  / <alpha-value>)',
        panel2: 'rgb(var(--c-panel2) / <alpha-value>)',
        line:   'rgb(var(--c-line)   / <alpha-value>)',
        line2:  'rgb(var(--c-line2)  / <alpha-value>)',
        fg:     'rgb(var(--c-fg)     / <alpha-value>)',
        muted:  'rgb(var(--c-muted)  / <alpha-value>)',
        amber: {
          DEFAULT: '#f5a623',
          600: '#e0941a',
          700: '#bd7a12',
        },
        success: '#3ECF8E',
        danger:  '#F0564A',
        info:    '#5B9BD5',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
export default config;
