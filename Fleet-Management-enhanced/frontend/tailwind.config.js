/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0D1117',
          900: '#161B22',
          800: '#21262D',
          700: '#30363D',
        },
        amber: {
          500: '#F59E0B', // primary action
          400: '#FBBF24',
          600: '#D97706',
        },
        red: {
          500: '#EF4444', // alert
          600: '#DC2626',
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        chakra: ['Chakra Petch', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse-fast 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanlines': 'scanlines 8s linear infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0, 0.66, 1) both',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
      },
      keyframes: {
        'pulse-fast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'scanlines': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        'shake': {
          '0%': { transform: 'translate(0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-5px, 0)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(5px, 0)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      boxShadow: {
        'tactical': '0 0 20px rgba(245, 158, 11, 0.3)',
        'danger': '0 0 15px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
