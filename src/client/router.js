const {BrowserRouter, Route, Switch} = require('react-router-dom');
const h = require('react-hyperscript');
const ReactGA = require('react-ga');
const _ = require('lodash');

const Features = require('./features');
const Error = require('./error');

ReactGA.initialize('UA-43341809-7');
let logPageView = page => {
  ReactGA.set({ page });
  ReactGA.pageview( page );
};


module.exports = () => {
  return h(BrowserRouter, [
    h(Switch, [
      {
        path: '/',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Search, props);
        }
      },
      {
        path: '/search',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Search, props);
        }
      },
      {
        path: '/pathways',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Pathways, props);
        }
      },
      {
        path: '/paint',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Paint, props);
        }
      },
      {
        path: '/interactions',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Interactions, props);
        }
      },
      {
        path: '/enrichment',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Enrichment, props);
        }
      },
      {
        path: '*',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Error, props);
        }
      }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};
