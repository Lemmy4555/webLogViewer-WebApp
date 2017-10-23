var path = require('path');

var _root = path.resolve(__dirname, "..");
var _app = path.resolve(__dirname, "../src/app");
var _src = path.resolve(__dirname, "../src");

const EVENT = process.env.npm_lifecycle_event || '';

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_root].concat(args));
}

function app(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_app].concat(args));
}

function src(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_src].concat(args));
}


exports.root = root;
exports.app = app;
exports.src = src;