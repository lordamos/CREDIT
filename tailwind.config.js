/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          base: '#08080A',
        },
        surface: {
          subtle: '#111115',
          elevated: '#18181F',
          overlay: '#22222B',
        },
        border: {
          hairline: 'rgba(255, 255, 255, 0.06)',
          elevated: 'rgba(255, 255, 255, 0.12)',
          gold: 'rgba(218, 185, 122, 0.22)',
        },
        lux: {
          primary: '#F5F5F7',
          secondary: '#9D9DA8',
          tertiary: '#5A5A66',
          gold: '#D9B779',
          'gold-hover': '#E8CD96',
          platinum: '#E2E8F0',
        },
      },
      boxShadow: {
        'lux-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'lux-md': '0 8px 24px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'lux-lg': '0 16px 40px -8px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.10)',
        'glow-gold': '0 0 32px -4px rgba(217, 183, 121, 0.18)',
        'glow-indigo': '0 0 32px -4px rgba(99, 102, 241, 0.22)',
      },
      backdropBlur: {
        lux: '16px',
      },
    },
  },
  plugins: [],
};
