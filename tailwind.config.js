/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      animation: {
        blob: 'blob 7s infinite',
        eq: 'equalizer 1.5s ease-in-out infinite',
      
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)', textShadow: 'none' },
          '20%': { transform: 'translate(-2px, 2px)', textShadow: '2px 2px #ff00ff' },
          '40%': { transform: 'translate(-2px, -2px)', textShadow: '2px -2px #00ffff' },
          '60%': { transform: 'translate(2px, 2px)', textShadow: '-2px 2px #ff00ff' },
          '80%': { transform: 'translate(2px, -2px)', textShadow: '-2px -2px #00ffff' }
        },
        slideUp: {
          from: { transform: 'translateY(100px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        equalizer: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '24px' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: []
}

