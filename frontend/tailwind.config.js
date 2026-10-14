/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'vnpt-blue': 'var(--vnpt-blue)',
        'vnpt-blue-light': 'var(--vnpt-blue-light)',
        'accent-cyan': 'var(--accent-cyan)'
      },
      fontFamily: {
        brand: ['Quicksand', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
