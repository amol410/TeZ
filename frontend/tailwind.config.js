/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dolphin: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bbdaff',
          300: '#8cc3ff',
          400: '#56a3ff',
          500: '#2d7fff',
          600: '#1a5ef5',
          700: '#1347e1',
          800: '#163ab6',
          900: '#18358f',
          950: '#142157',
        },
        ocean: {
          50: '#f0fdf9',
          100: '#ccfbee',
          200: '#99f5dd',
          300: '#5de8c8',
          400: '#2dd3af',
          500: '#14b897',
          600: '#0c9279',
          700: '#0d7563',
          800: '#0e5e50',
          900: '#0e4d43',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'flip': 'flip 0.6s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
