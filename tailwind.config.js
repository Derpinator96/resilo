/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0A192F' },
        teal: { DEFAULT: '#0D9488' },
        softGray: { DEFAULT: '#F9FAFB' }
      }
    },
  },
  plugins: [],
}
