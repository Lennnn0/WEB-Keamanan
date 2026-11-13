/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#dce7f3',
          200: '#bed1e7',
          300: '#94b5d6',
          400: '#6493c0',
          500: '#4376aa',
          600: '#325d8e',
          700: '#284b74',
          800: '#1e3857',
          900: '#0f1d2e',
          950: '#070e17',
        },
        royal: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(15, 29, 46, 0.08), 0 8px 10px -6px rgba(15, 29, 46, 0.04)',
        'elevated': '0 20px 25px -5px rgba(15, 29, 46, 0.12), 0 8px 10px -6px rgba(15, 29, 46, 0.08)',
      }
    },
  },
  plugins: [],
}

