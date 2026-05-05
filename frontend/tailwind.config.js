/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hospital: {
          50:  '#e8f4fd',
          100: '#d1e9fb',
          500: '#2E75B6',
          600: '#1B5F9E',
          700: '#1B3F6E',
        },
      },
    },
  },
  plugins: [],
};
