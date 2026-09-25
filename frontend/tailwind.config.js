/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          accent: 'var(--accent-primary)',
          'accent-hover': 'var(--accent-hover)',
          border: 'var(--border-color)',
        }
      },
      fontFamily: {
        sans: ['var(--font-family)', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
