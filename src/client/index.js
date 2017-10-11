require('babel-polyfill');
require('whatwg-fetch');

const debug = require('./debug');
const hh = require('hyperscript');
const h = require('react-hyperscript');
const Router = require('./router');
const ReactDOM = require('react-dom');

const RegisterCyExtensions = require('./cytoscape-extensions.js');

if( debug.enabled() ){
  debug.init();
}

RegisterCyExtensions();

let root = hh('div#root');
document.body.appendChild( root );

ReactDOM.render( h(Router), root);
