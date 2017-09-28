
const {BrowserRouter, Route, Switch} = require('react-router-dom');
const h = require('react-hyperscript');
const _ = require('lodash');
const Button = require('material-ui').Button;
const Features = require('./features');

const Entry = () => h('div', 'entry');
const Search = () => h(Button, {className: 'search'}, 'search');
const View = () => h('div', 'view');
const Err = () => h('div', 'err');

module.exports = () => {
  return h(BrowserRouter, [
    h(Switch, [
      {
        path: '/',
        render: props => h(Entry, props)
      },
      {
        path: '/search',
        render: props => h(Search, props)
      },
      {
        path: '/view',
        render: props => h(View, props)
      },
      {
        path: '/paint',
        render: props => h(Features.Paint, props)
      },
      {
        path: '*',
        render: props => h(Err, props)
      }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};