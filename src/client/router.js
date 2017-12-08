
const {BrowserRouter, Route} = require('react-router-dom');
const h = require('react-hyperscript');
const ReactGA = require('react-ga');
const _ = require('lodash');

const Features = require('./features');
const config = require('../config');

ReactGA.initialize('UA-43341809-7');
const Analytics = (props) => {
  ReactGA.set({ page: props.location.pathname + props.location.search });
  ReactGA.pageview(props.location.pathname + props.location.search);
  return null;
};

module.exports = () => {
  return h(BrowserRouter, { basename: config.baseName }, [
    h('div', [
      {
        path: '*',
        render: props => h(Analytics, props)
      },
      {
        path: '/',
        render: props => h(Features.Search, props)
      },
      {
        path: '/search',
        render: props => h(Features.Search, props)
      },
      {
        path: '/view',
        render: props => h(Features.View, props)
      },
      {
        path: '/paint',
        render: props => h(Features.Paint, props)
      },
      {
        path: '/edit',
        render: props => {
          const editProps = _.assign({}, props, {
            admin: true
          });
          return h(Features.View, editProps);
        }
      }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};