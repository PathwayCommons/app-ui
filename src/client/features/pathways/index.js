const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');
const classNames = require('classNames');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const { EmptyNetwork } = require('../../common/components/empty-network');
const { defaultLayout } = require('../../common/cy/layout');


class Pathways extends React.Component {
  constructor(props) {
    super(props);
    let { uri } = queryString.parse(props.location.search);

    this.state = {
      cySrv: new CytoscapeService(),
      pathwayJSON: {},
      pathwayMetadata: {
        uri: uri,
        name: '',
        datasource: '',
        comments: []
      },
      loading: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { pathwayMetadata, cySrv} = this.state;
    let { uri } = pathwayMetadata;

    ServerAPI.getPathway(uri, 'latest').then( pathwayJSON => {
      cySrv.mount(this.network);
      let cy = cySrv.get();

      cy.remove('*');
      cy.add(pathwayJSON.graph);
      let layout = cy.layout(defaultLayout.options);

      layout.on('layoutstop', () => {
        cySrv.load();
        console.log(pathwayJSON);
        this.setState({
          pathwayJSON: _.get(pathwayJSON, 'graph', { nodes: [], edges: [] }),
          pathwayMetadata: {
            name: _.get(pathwayJSON, 'graph.pathwayMetadata.title.0', 'Untitled Pathway'),
            datasource: _.get(pathwayJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown data source'),
            comments: _.get(pathwayJSON, 'graph.pathwayMetadata.comments', [])
          },
          loading: false
        });
      });

      layout.run();
    });
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  render() {
    let state = this.state;

    console.log( this.state);
    let network = h('div.network', [
      h('div.network-cy', {
        ref: dom => this.network = dom
      })
    ]);

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h('i.app-bar-logo', { href: 'http://www.pathwaycommons.org/' }),
        h('div.app-bar-title', state.pathwayMetadata.name + ' | ' + state.pathwayMetadata.datasource)
      ])
    ]);
    // h('div.view-toolbar', [
      // '1','2','3','4'
    // ])

    return h('div.pathways', [
      network,
      appBar
    ]);
  }

}


module.exports = Pathways;