require('babel-polyfill');

let debug = require('./debug');

if( debug.enabled() ){
  debug.init();
}

// TODO client
// react example

let React = require('react');
let ReactDOM = require('react-dom');

let div = document.createElement('div');
document.body.appendChild( div );

ReactDOM.render(
  <h1>Hello, world!</h1>,
  div
);
