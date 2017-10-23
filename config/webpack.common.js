var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./helpers');
var path = require("path");
var jsonImporter = require("node-sass-json-importer");

module.exports = {
  entry: {
    'polyfills': path.resolve('./src/polyfills.ts'),
    'vendor': path.resolve('./src/vendor.ts'),
    'app': path.resolve('./src/main.ts')
  },

  devtool: 'cheap-module-eval-source-map',

  output: {
    path: helpers.root('dist'),
    publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      "Components": helpers.app("components"),
      "Util": helpers.app("util"),
      "Logger": helpers.app("logger"),
      "Handlers": helpers.app("handlers"),
      "Services": helpers.app("services"),
      "Helpers": helpers.app("helpers"),
      "Models": helpers.app("models"),
      "Jobs": helpers.app("jobs"),
      "Images": helpers.src("assets/images")
    },
    modules: [
      path.resolve('.'),
      'node_modules'
    ]
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          {
            loader: 'awesome-typescript-loader',
            options: { configFileName: helpers.root('src', 'tsconfig.json') }
          }, 'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file-loader?name=assets/[name].[hash].[ext]'
      },
      {
        test: /\.css$/,
        exclude: helpers.root('src', 'app'),
        loader: ExtractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: 'css-loader?sourceMap' })
      },
      {
        test: /\.css$/,
        include: helpers.root('src', 'app'),
        use: ['raw-loader']
      },
      {
        test: /\.scss$/,
        use: [
          'to-string-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            },
          },
          {
            loader: 'sass-loader',
            options: {
              importer: jsonImporter,
            },
          }],
        exclude: [helpers.root('src', 'styles')]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            },
          },
          {
            loader: 'sass-loader',
            options: {
              importer: jsonImporter,
            },
          }],
        include: [helpers.root('src', 'styles')]
      }
    ]
  },

  plugins: [
    // Workaround for angular/angular#11580
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
      helpers.root('./src'), // location of your src
      {} // a map of your routes
    ),

    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),

    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery'
    }),

    new ExtractTextPlugin('[name].css')
  ],

  devServer: {
    historyApiFallback: true,
    stats: 'minimal'
  }
};

