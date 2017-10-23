var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var helpers = require('./helpers');
var path = require("path");
var webpack = require("webpack");

const ENV = process.env.ENV = process.env.NODE_ENV = 'development';

module.exports = webpackMerge(commonConfig, {
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "external-server-dev"),
      __APIROOT__: JSON.stringify("http://localhost:8080"),
      __APICONTEXT__: JSON.stringify("webLogViewer"),
      __USECACHEDB__: JSON.stringify(false),
    })
  ]
});
