const webpack = require('webpack');
const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const isNonNil = x => x != null;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const isProfile = env.PROFILE == 'true';

let conf = {
  entry: './src/client/index.js',

  output: {
    filename: './build/bundle.js'
  },

  devtool: 'inline-source-map',
  module: {
    rules: [
      { test: /node_modules\/cytoscape\/.*/, loader: 'babel-loader'},
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  },
  resolve: {
    alias: {
      cytoscape: 'cytoscape/src/cjs'
    }
  },
  plugins: [
    isProfile ? new BundleAnalyzerPlugin() : null,

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
