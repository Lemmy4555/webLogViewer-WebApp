/**
 * @author: @AngularClass
 */
var path = require('path');

const EVENT = process.env.npm_lifecycle_event || '';

/**
 * Helper functions.
 */
var ROOT = path.resolve(__dirname, '..');

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1;
}

function hasNpmFlag(flag) {
  return EVENT.includes(flag);
}

function isWebpackDevServer() {
  return process.argv[1] && !! (/webpack-dev-server/.exec(process.argv[1]));
}

var root = path.join.bind(path, ROOT);
var src = path.join.bind(path, root('src'));
var app = path.join.bind(path, root('src/app'));
var shared = path.join.bind(path, root('src/app/shared'));

exports.hasProcessFlag = hasProcessFlag;
exports.hasNpmFlag = hasNpmFlag;
exports.isWebpackDevServer = isWebpackDevServer;
exports.root = root;
exports.src = src;
exports.app = app;
exports.shared = shared;