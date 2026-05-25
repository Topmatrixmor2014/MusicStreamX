/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          900: '#581c87',
        },
        pink: {
          50: '#fdf2f8',
          900: '#831843',
        },
      },
    },
  },
  plugins: [],
};
