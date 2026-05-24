import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f0f5f2',
          100: '#d8e8de',
          200: '#b4d1be',
          300: '#8ab5a0',
          400: '#7B9E87',
          500: '#5d8a70',
          600: '#4A6B55',
          700: '#3a5543',
          800: '#2a3f31',
          900: '#1a2820',
        },
        fog:   '#F4F2EE',
        mist:  '#EAE8E3',
        stone: '#C8C4BC',
        ink: {
          DEFAULT: '#1C1C1A',
          soft:    '#3A3A36',
          muted:   '#7A7A74',
          ghost:   '#B0AEA8',
        },
        warm:  '#C4956A',
        teal:  '#3D6B7A',
        surface: {
          DEFAULT: '#F4F2EE',
          elevated: '#FFFFFF',
          dark: '#0F1210',
          'dark-elevated': '#1A1E1B',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.1em' }],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease forwards',
        'slide-up':     'slideUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':        'float 6s ease-in-out infinite',
        'pulse-soft':   'pulseSoft 3s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'blink':        'blink 1.2s ease infinite',
        'marquee':      'marquee 28s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        'glass':     '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-dark':'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card':      '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover':'0 12px 40px rgba(0,0,0,0.1)',
        'mood':      '0 16px 48px rgba(74,107,85,0.2)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
