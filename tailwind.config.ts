import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08090B',
        panel: '#08090B',
        paper: '#F5F3EF',
        muted: 'rgba(8, 9, 11, 0.62)',
        lime: '#FFC900',
        'lime-soft': '#FFC900',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
