const webpack = require('webpack');
const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const isNonNil = x => x != null;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const isProfile = env.PROFILE == 'true';

// Define environment variables with default values
const envDefaults = {
  NODE_ENV: 'development',
  PC_URL: 'https://www.pathwaycommons.org',
  FACTOID_URL: 'https://factoid.baderlab.org'
};

let conf = {
  entry: './src/client/index.js',

  output: {
    filename: './public/bundle.js',
    path: __dirname
  },

  devtool: 'inline-source-map',
  module: {
    rules: [
      { 
        test: /\.js$/, 
        exclude: /node_modules/, 
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['last 3 versions', 'ie >= 11']
              }
            }],
            '@babel/preset-react'
          ],
          plugins: [
            '@babel/plugin-transform-async-generator-functions'
          ]
        }
      }
    ]
  },
  plugins: [
    isProfile ? new BundleAnalyzerPlugin() : null,

    // Use EnvironmentPlugin with default values
    new webpack.EnvironmentPlugin(envDefaults),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'deps',
      filename: './public/deps.js',
      minChunks( module ){
        let context = module.context || '';

        return context.indexOf('node_modules') >= 0;
      }
    }),

    isProd ? new UglifyJSPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }) : null
  ].filter( isNonNil )
};

module.exports = conf;
