/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 传统中式配色
        zhu: {
          50: '#fff5f3',
          100: '#ffe6e1',
          200: '#ffc7bd',
          300: '#ff9d8d',
          400: '#f76b54',
          500: '#e64535',
          600: '#c93225',
          700: '#a8261c',
          800: '#86201a',
          900: '#6d1d18',
        },
        mo: {
          50: '#f6f6f5',
          100: '#e7e7e5',
          200: '#cfcfcb',
          300: '#a9a9a3',
          400: '#7d7d76',
          500: '#5b5b55',
          600: '#444440',
          700: '#33332f',
          800: '#22221f',
          900: '#141413',
        },
        xuan: '#1a1411',
        mihuang: '#f6efe3',
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          'STSong',
          'serif',
        ],
        kai: ['"LXGW WenKai"', '"KaiTi"', 'STKaiti', 'serif'],
      },
    },
  },
  plugins: [],
};
