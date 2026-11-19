export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0848FE',
          50: '#F2F6FF',
          100: '#E1E9FF',
          600: '#063ACB',
          700: '#052FA5',
        },
        accent: {
          DEFAULT: '#0099FF',
          50: '#F2F6FF',
        },
        ink: '#3F3F3F',
        muted: '#6E6E6E',
        line: '#DDDDDD',
        canvas: '#F2F6FF',
      },
    },
  },
};
