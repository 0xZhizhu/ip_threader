// postcss.config.js
module.exports = {
  plugins: {
    // THE FIX IS HERE: Change 'tailwindcss' to '@tailwindcss/postcss' (as a string literal)
    '@tailwindcss/postcss': {}, 
    autoprefixer: {}, 
  },
};