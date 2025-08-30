/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      colors: {
        // Custom dark mode colors
        'dark': {
          'bg': '#0f172a',
          'surface': '#1e293b',
          'border': '#334155',
          'text': '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
