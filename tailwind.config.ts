import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#800020',
          hover: '#600018',
          light: '#f9f2f4',
          dark: '#4d0010',
        },
        surface: {
          main: '#ffffff',
          card: '#ffffff',
          hero: '#ffffff',
          section: '#fcfafb',
          muted: '#1a0006',
        },
        ink: {
          main: '#1a1c1e',
          muted: '#454d55',
          soft: '#9aa1b0',
        },
        line: '#e0e3eb',
        gold: '#ffb400',
      },
      boxShadow: {
        sm: '0 2px 6px rgba(0,0,0,0.06)',
        md: '0 8px 24px rgba(0,0,0,0.08)',
        lg: '0 16px 32px rgba(0,0,0,0.12)',
        glow: '0 8px 25px rgba(200, 75, 97, 0.4)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        pill: '40px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        modalUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease',
        modalUp: 'modalUp 0.4s cubic-bezier(0.4,0,0.2,1)',
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
