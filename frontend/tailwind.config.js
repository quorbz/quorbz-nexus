/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#b9ccff',
          300: '#85a9ff',
          400: '#4d7eff',
          500: '#1a52ff',
          600: '#0036f5',
          700: '#002bcd',
          800: '#0025a6',
          900: '#001f85',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
