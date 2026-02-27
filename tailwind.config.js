/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5f5',
          100: '#fde3e3',
          200: '#fcc5c5',
          300: '#f9a0a0',
          400: '#f27a7a',
          500: '#e85555',
          600: '#d03c3c',
          700: '#b02e2e',
          800: '#922626',
          900: '#762020',
        },
      },
    },
  },
  plugins: [],
}
