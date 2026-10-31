import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101010',
        panel: '#171717',
        paper: '#F3F1EB',
        muted: '#929292',
        lime: '#C5FF45',
        'lime-soft': '#d4ff6e',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

