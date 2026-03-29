/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        eggshell: '#F9F7F2',
        sage: '#81B29A',
        terracotta: '#E07A5F',
        mustard: '#F2CC8F',
        charcoal: '#3D405B',
      },
      borderRadius: {
        '4xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        'clayOuter': '8px 8px 16px rgba(61, 64, 91, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.8)',
        'clayInset': 'inset 8px 8px 16px rgba(61, 64, 91, 0.15), inset -8px -8px 16px rgba(255, 255, 255, 0.8)',
        'clayOuterSm': '4px 4px 8px rgba(61, 64, 91, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.6)',
        'clayInsetSm': 'inset 4px 4px 8px rgba(61, 64, 91, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.6)',
      }
    },
  },
  plugins: [],
}
