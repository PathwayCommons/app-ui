const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const isNonNil = x => x != null;

let conf = {
  plugins: [
    require('postcss-import')(),
    require('postcss-url')({ url: 'inline', maxSize: Number.MAX_SAFE_INTEGER }),
    require('postcss-cssnext')({
      browsers: "> 1%, last 2 versions",
      warnForDuplicates: false
    }),
    isProd ? require('cssnano')({
      preset: 'default',
    }) : null
  ].filter( isNonNil )
};

module.exports = conf;
