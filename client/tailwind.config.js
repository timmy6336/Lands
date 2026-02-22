/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:         'var(--bg)',
        surface:    'var(--surface)',
        'surface-2':'var(--surface2)',
        accent:     'var(--accent)',
        foreground: 'var(--text)',
        muted:      'var(--muted)',
        border:     'var(--border)',
        'land-white': 'var(--white-land)',
        'land-red':   'var(--red-land)',
        'land-blue':  'var(--blue-land)',
        'land-green': 'var(--green-land)',
        'land-black': 'var(--black-land)',
      },
    },
  },
  plugins: [],
};
