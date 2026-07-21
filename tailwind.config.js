/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0503',
        ember: {
          50: '#fff4ed',
          200: '#ffcfa8',
          300: '#ffab6b',
          400: '#ff8a3d',
          500: '#ff6a1f',
          600: '#f04d0a',
          700: '#c5350a',
        },
        blood: {
          400: '#ff4d3d',
          500: '#e11d0f',
          600: '#b3140a',
          700: '#7d0f08',
        },
        gold: '#ffc24b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
