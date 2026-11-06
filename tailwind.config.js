/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  darkMode: 'class',
  content: ['components/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '2560px',
        xxs: '320px',
        xs: '375px',
      },
      boxShadow: {
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 1)',
        clicked: 'inset 0 2px 18px 0 rgba(0, 0, 0, 1)',
        'custom-light':
          '0 4px 6px -1px var(--shadow-color-light), 0 2px 4px -1px var(--shadow-color-light)',
        'custom-dark':
          '0 4px 6px -1px var(--shadow-color-dark), 0 2px 4px -1px var(--shadow-color-dark)',
      },
      animation: {
        fadeIn: 'fadeIn 400ms ease-in',
        fadeOut: 'fadeOut 400ms ease-out',
        fadeSlideUp: 'fadeSlideUp 400ms ease-in',
        fadeSlideDown: 'fadeSlideDown 400ms ease-out forwards',
        slideFadeInLeft: 'slideFadeInLeft 400ms ease-in',
        slideFadeOutRight: 'slideFadeOutRight 400ms ease-out',
        slideThumb: 'slideThumb 300ms ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeSlideUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '50%': { transform: 'translateY(0%)', opacity: 0.1 },
          '75%': { transform: 'translateY(0%)', opacity: 0.5 },
          '100%': { transform: 'translateY(0%)', opacity: 1 },
        },
        slideThumb: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(100% + 0.5rem))' },
        },
        fadeSlideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideFadeInLeft: {
          '0%': { opacity: 0, transform: 'translateX(50%)' },
          '100%': { opacity: 1, transform: 'translateX(0%)' },
        },
        slideFadeOutRight: {
          '0%': { opacity: 0, transform: 'translateX(50%)' },
          '100%': { opacity: 1, transform: 'translateX(0%)' },
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  variants: {
    extend: {
      backgroundImage: ['hover', 'focus'],
    },
  },

  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    require('@headlessui/tailwindcss'),

    function ({ addUtilities }) {
      const disconnectButton = {
        '.btn-disconnect-gradient': {
          backgroundImage: 'linear-gradient(98.22deg, #FF8787 -51.92%, #C50C87 103.12%)',
          transition: 'all 0.3s ease',
          '&:hover:not(:disabled)': {
            backgroundImage: 'linear-gradient(98.22deg, #FF9A9A -51.92%, #D61F98 103.12%)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            border: 'none',
            backgroundImage: 'linear-gradient(98.22deg, #FF8787 -51.92%, #C50C87 103.12%)',
            boxShadow: 'none',
          },
        },
      };
      const toolTip = {
        '.tooltip-primary': {
          color: '#FFFFFF',
          textColor: '#FFFFFF',
        },
        '.token-amount.tooltip:before': {
          'max-width': 'none',
        },
      };
      const errorButton = {
        '.btn-error': {
          border: 'none',
          color: '#FFFFFF',
          backgroundColor: '#E53935',
          transition: 'all 0.3s ease',
          '&:hover:not(:disabled)': {
            backgroundColor: '#D32F2F',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            border: 'none',
            boxShadow: 'none',
            backgroundColor: '#4f1312',
            color: '#FFFFFF',
          },
        },
      };
      const connectButton = {
        '.btn-gradient': {
          border: 'none',
          color: '#FFFFFF',
          backgroundImage: 'linear-gradient(98.22deg, #A087FF -51.92%, #380CC5 103.12%)',
          transition: 'all 0.3s ease',
          '&:hover:not(:disabled)': {
            backgroundImage: 'linear-gradient(98.22deg, #B19AFF -51.92%, #4A1FD6 103.12%)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            border: 'none',
            boxShadow: 'none',
            backgroundImage: 'linear-gradient(98.22deg, #A087FF -51.92%, #380CC5 103.12%)',
            color: '#fffcfc',
            cursor: 'not-allowed',
          },
        },
      };
      const dropDownBtns = {
        '.btn-dropdown': {
          backgroundColor: '#E0E0FF0A',
          border: '1px solid #00000033',
          transition: 'all 0.3s ease',
          '@apply dark:bg-[#E0E0FF0A] dark:border-[#FFFFFF33]': {},
          '&:hover:not(:disabled)': {
            background: '#E0E0FF0A',
            boxShadow: '0 0 4px #E0E0FF0A',
            border: '1px solid #00000033',
            '@apply dark:bg-[#E0E0FF0A] dark:border-[#FFFFFF33] dark:shadow-[0_0_4px_#E0E0FF0A]':
              {},
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            border: 'none',
            boxShadow: 'none',
          },
        },
      };
      addUtilities(disconnectButton, ['responsive', 'hover', 'disabled']);
      addUtilities(connectButton, ['responsive', 'hover', 'disabled']);
      addUtilities(dropDownBtns, ['responsive', 'hover', 'disabled']);
      addUtilities(toolTip, ['responsive', 'hover', 'disabled']);
      addUtilities(errorButton, ['responsive', 'hover', 'disabled']);
    },
  ],
};
export default tailwindConfig;
