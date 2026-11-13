/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#121212',
          card: '#181818',
          cardHover: '#282828',
          subtext: '#B3B3B3',
          border: '#282828'
        },
        amoled: {
          bg: '#000000',
          card: '#080808',
          border: '#151515'
        }
      },
      animation: {
        'mesh-slow': 'mesh 20s ease-in-out infinite alternate',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        mesh: {
          '0%': { transform: 'scale(1) translate(0%, 0%) rotate(0deg)' },
          '50%': { transform: 'scale(1.2) translate(-5%, 8%) rotate(5deg)' },
          '100%': { transform: 'scale(1.05) translate(4%, -6%) rotate(-3deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
