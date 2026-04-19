/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF7F2',
          100: '#F5F0E8',
          200: '#EDE4D3',
          300: '#DDD0BB',
        },
        charcoal: {
          900: '#1A1612',
          800: '#2D2520',
          700: '#3D332C',
          600: '#4F443C',
        },
        accent: {
          DEFAULT: '#C8472A',
          hover: '#A63820',
          light: '#E8604A',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
