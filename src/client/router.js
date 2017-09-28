
const {BrowserRouter, Route} = require('react-router-dom');
const h = require('react-hyperscript');
const ReactGA = require('react-ga');
const _ = require('lodash');

const Features = require('./features');

const Entry = () => h('div', 'entry');
const Search = () => h('div', {className: 'search'}, 'search');
const View = () => h('div', 'view');


ReactGA.initialize('UA-43341809-7');
const Analytics = (props) => {
  ReactGA.set({ page: props.location.pathname + props.location.search });
  ReactGA.pageview(props.location.pathname + props.location.search);
  return null;
};


module.exports = () => {
  return h(BrowserRouter, [
    h('div', [
      {
        path: '*',
        render: props => h(Analytics, props)
      },
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
      }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};