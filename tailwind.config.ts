/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // NEW: Explicitly include PostCSS and Tailwind plugins here
    require('tailwindcss'),
    require('postcss-preset-env'), // Often needed for Tailwind to correctly process CSS
  ],
};