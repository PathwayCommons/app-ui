const {BrowserRouter, Route, Switch} = require('react-router-dom');
const h = require('react-hyperscript');
const _ = require('lodash');
const qs = require('query-string');

const Features = require('./features');

module.exports = () => {
  return h(BrowserRouter, [
    h(Switch, [
      {
        path: '/',
        render: props => {
          return h(Features.Search, props);
        }
      },
      {
        path: '/search',
        render: props => {
          return h(Features.Search, props);
        }
      },
      {
        path: '/pathways',
        render: props => {
          let uri = qs.parse(location.search).uri;
          let apiOpts = {
            type: 'pathways',
            uri
          };
          const downloadOpts = {
            downloadTypes: [ 'png', 'gmt', 'sif', 'txt', 'biopax', 'jsonld', 'sbgn' ]
          };

          return h(Features.Pathways, _.assign( {}, props, { apiOpts, downloadOpts } ));
        }
      },
      {
        path: '/biofactoid',
        render: props => {
          return h(Features.Biofactoid, props);
        }
      },
      {
        path: '/biofactoid/:id',
        render: props => {
          let { match } = props;
          let { id } = match.params;
          let apiOpts = {
            type: 'biofactoid',
            id
          };

          return h(Features.Pathways, _.assign( {}, props, { apiOpts } ));
        }
      },
      {
        path: '/paint',
        render: props => {
          return h(Features.Paint, props);
        }
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
        path: '*',
        render: props => {
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
