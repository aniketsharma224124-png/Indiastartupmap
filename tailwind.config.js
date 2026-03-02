/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#050810',
          900: '#0A0E1A',
          800: '#0D1525',
          700: '#0F1D35',
        },
        accent: {
          blue: '#3B7DD8',
          glow: '#63B3FF',
          gold: '#F6C90E',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'zoom-in': 'zoomIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(99,179,255,0.4)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(99,179,255,0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}
