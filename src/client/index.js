require('babel-polyfill');

const debug = require('./debug');
const hh = require('hyperscript');
const h = require('react-hyperscript');
const Router = require('./router');
const ReactDOM = require('react-dom');

if( debug.enabled() ){
  debug.init();
}

let root = hh('div#root');
document.body.appendChild( root );

ReactDOM.render( h(Router), root);
