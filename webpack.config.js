const webpack = require('webpack');
const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const isNonNil = x => x != null;

let conf = {
  entry: './src/client/index.js',

  output: {
    filename: './build/bundle.js'
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },

  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV']),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'deps',
      filename: './build/deps.js',
      minChunks( module ){
        let context = module.context || '';

        return context.indexOf('node_modules') >= 0;
      }
    }),

    isProd ? new UglifyJSPlugin() : null
  ].filter( isNonNil )
};

module.exports = conf;
