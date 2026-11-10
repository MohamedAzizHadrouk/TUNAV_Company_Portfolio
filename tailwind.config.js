export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0A3DFF',
          50: '#EEF2FF',
          100: '#DCE4FF',
          600: '#0832D6',
          700: '#0727AA',
        },
        accent: {
          DEFAULT: '#0BC5F2',
          50: '#E7F9FE',
        },
        ink: '#0B1220',
        muted: '#5B6475',
        line: '#E6E9F0',
        canvas: '#F7F8FB',
      },
    },
  },
};
