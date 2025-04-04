import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-up-fade': {
          '0%': { 
            transform: 'translateY(100px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'slide-down-fade': {
          '0%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100px)',
            opacity: '0'
          }
        }
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 0.4s ease-out',
        'slide-down-fade': 'slide-down-fade 0.4s ease-out forwards'
      }
    }
  },
  plugins: [tailwindScrollbar({ nocompatible: true })],

};
