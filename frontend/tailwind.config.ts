import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Zenco Brand ───────────────────────────────────────
        primary: {
          DEFAULT: '#0C094D',
          50:  '#EEEEF9',
          100: '#CFCFF0',
          200: '#9F9FE0',
          300: '#6E6FD1',
          400: '#3E3FC1',
          500: '#0C094D',
          600: '#0A0840',
          700: '#080633',
          800: '#060426',
          900: '#040319',
        },
        accent: {
          DEFAULT: '#F26C0C',
          50:  '#FEF3E7',
          100: '#FDE0BE',
          200: '#FBBF75',
          300: '#F99E2C',
          400: '#F26C0C',
          500: '#CC5A0A',
          600: '#A64807',
          700: '#803605',
          800: '#592403',
          900: '#331302',
        },
        // ── UI Surfaces ───────────────────────────────────────
        surface: {
          DEFAULT: '#F8F9FC',
          dark: '#0A0920',
          card: '#FFFFFF',
          'card-dark': '#111028',
          border: '#E5E7EB',
          'border-dark': '#1E1B4B',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-alice)', 'var(--font-dm-sans)', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm':  ['1.875rem', { lineHeight: '1.25' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        'glow-primary': '0 0 30px rgba(12, 9, 77, 0.15)',
        'glow-accent':  '0 0 30px rgba(242, 108, 12, 0.25)',
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.12)',
        'xl':    '0 8px 30px rgba(0,0,0,0.12)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0C094D 0%, #1a1760 50%, #0C094D 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0A0920 0%, #0C094D 40%, #1E1B4B 100%)',
        'gradient-accent': 'linear-gradient(135deg, #F26C0C 0%, #FF8C2A 100%)',
        'mesh-primary': 'radial-gradient(ellipse at top left, rgba(242, 108, 12, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(12, 9, 77, 0.05) 0%, transparent 50%)',
      },

      animation: {
        'fade-up':    'fadeUp 0.5s ease-out forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-in':   'slideIn 0.4s ease-out forwards',
        'float':      'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
        'ticker':     'ticker 30s linear infinite',
      },

      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(242, 108, 12, 0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(242, 108, 12, 0.4)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
