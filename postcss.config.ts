import autoprefixer from 'autoprefixer';
import postcssEnv from 'postcss-env-function';

module.exports = {
  plugins: [
    postcssEnv(),
    autoprefixer(),
  ],
};
