const {BrowserRouter, Route, Switch} = require('react-router-dom');
const h = require('react-hyperscript');
const ReactGA = require('react-ga');
const _ = require('lodash');
const qs = require('query-string');

const Features = require('./features');

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
          let { pathname } = location;
          let uri = qs.parse(location.search).uri;
          let apiOpts = {
            type: 'pathways',
            uri
          };
          const downloadOpts = {
            downloadTypes: [ 'png', 'gmt', 'sif', 'txt', 'biopax', 'jsonld', 'sbgn' ]
          };

          logPageView(pathname + uri);
          return h(Features.Pathways, _.assign( {}, props, { apiOpts, downloadOpts } ));
        }
      },
      {
        path: '/factoids',
        render: props => {
          let { location } = props;
          let { pathname, search } = location;
          logPageView(pathname + search);
          return h(Features.Factoids, props);
        }
      },
      {
        path: '/factoids/:factoidId',
        render: props => {
          let { location, match } = props;
          let { pathname } = location;
          let id = match.params.factoidId;
          let apiOpts = {
            type: 'factoids',
            id
          };

          logPageView( pathname + id );
          return h(Features.Pathways, _.assign( {}, props, { apiOpts } ));
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
          let { pathname } = location;
          logPageView(pathname);
          props = _.assign({ notFoundError: true }, props);
          return h(Features.Search, props);
        }
      }
      // {
      //   path: '/interactions',
      //   render: props => {
      //     return h(Features.Interactions, props);
      //   }
      // },
      // {
      //   path: '/enrichment',
      //   render: props => {
      //     return h(Features.Enrichment, props);
      //   }
      // },
      // {
      //   path: '/edit',
      //   render: props => {
      //     const editProps = _.assign({}, props, {
      //       admin: true
      //     });
      //     return h(Features.Edit, editProps);
      //   }
      // }
    ].map( spec => h(Route, _.assign({ exact: true }, spec)) ))
  ]);
};
