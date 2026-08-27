/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      colors: {
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ED',
          indigo: '#5856d6',
          purple: '#af52de',
          pink: '#ff2d55',
          red: '#ff3b30',
          orange: '#ff9500',
          yellow: '#ffcc00',
          green: '#34c759',
          teal: '#5ac8fa',
          cyan: '#32ade6',
          gray: {
            50: '#fbfbfd',
            100: '#f5f5f7',
            200: '#e8e8ed',
            300: '#d2d2d7',
            400: '#86868b',
            500: '#6e6e73',
            600: '#424245',
            700: '#333336',
            800: '#1d1d1f',
            900: '#161617',
            950: '#000000',
          },
        },
      },
      boxShadow: {
        'apple-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'apple-md': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        'apple-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'apple-glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glow-blue': '0 0 20px -2px rgba(0, 113, 227, 0.4)',
        'glow-green': '0 0 20px -2px rgba(52, 199, 89, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
