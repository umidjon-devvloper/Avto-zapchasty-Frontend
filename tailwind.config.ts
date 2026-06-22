import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Industrial parts-catalog palette (to'q ko'mir + amber)
        ink: '#0d0d0f',
        panel: '#16161a',
        panel2: '#1c1c21',
        line: '#2a2a31',
        line2: '#3a3a42',
        fg: '#f0efed',
        muted: '#928f88',
        amber: {
          DEFAULT: '#f5a623',
          600: '#e0941a',
          700: '#bd7a12',
        },
        success: '#3ECF8E',
        danger: '#F0564A',
        info: '#5B9BD5',
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
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
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
