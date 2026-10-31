const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: token('card'),
        'card-foreground': token('card-foreground'),
        primary: token('primary'),
        'primary-foreground': token('primary-foreground'),
        muted: token('muted'),
        'muted-foreground': token('muted-foreground'),
        border: token('border'),
        ring: token('ring'),
        destructive: token('destructive'),
        'destructive-foreground': token('destructive-foreground'),
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
    },
  },
  plugins: [],
}
