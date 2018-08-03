const {BrowserRouter, Route} = require('react-router-dom');
const h = require('react-hyperscript');
const ReactGA = require('react-ga');
const _ = require('lodash');

const Features = require('./features');

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
        render: props => h(Features.Search, props)
      },
      {
        path: '/search',
        render: props => h(Features.Search, props)
      },
      {
        path: '/pathways',
        render: props => h(Features.Pathways, props)
      },
      {
        path: '/paint',
        render: props => h(Features.Paint, props)
      },
      {
        path: '/interactions',
        render: props => {
          return h(Features.Interactions, props);
        }
      },
      {
        path: '/enrichment',
        render: props => {
          return h(Features.Enrichment, props);
        }
      },
      {
        path: '/enrichment-map',
        render: props => {
          return h(Features.EnrichmentMap, props);
        }
      },
      {
        path: '/tn',
        render: props => {
          return h(Features.I, props);
        }
      }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};
