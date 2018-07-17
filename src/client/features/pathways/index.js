const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const EventEmitter = require('eventemitter3');

const Loader = require('react-loader');
const classNames = require('classNames');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const { EmptyNetwork } = require('../../common/components/empty-network');
const Tooltip = require('../../common/components/tooltip');
const { defaultLayout } = require('../../common/cy/layout');

const PathwaysButtons = require('./pathways-buttons');
const { stylesheet, bindPathwaysEvents } = require('./pathways-cy');

class Pathways extends React.Component {
  constructor(props) {
    super(props);
    let { uri } = queryString.parse(props.location.search);

    this.state = {
      cySrv: new CytoscapeService({ style: stylesheet }),
      bus: new EventEmitter(),
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
      bindPathwaysEvents(cy);

      cy.remove('*');
      cy.add(pathwayJSON.graph);
      let layout = cy.layout(defaultLayout.options);

      layout.on('layoutstop', () => {
        cySrv.load();
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
    let { pathwayMetadata, cySrv, bus } = this.state;

    let network = h('div.network', [
      h('div.network-cy', {
        ref: dom => this.network = dom
      })
    ]);

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h('i.app-bar-logo', { href: 'http://www.pathwaycommons.org/' }),
        h('div.app-bar-title', pathwayMetadata.name + ' | ' + pathwayMetadata.datasource)
      ])
    ]);

    let toolbar = h('div.view-toolbar', [
      h(PathwaysButtons, { cySrv, bus })
    ]);

    return h('div.pathways', [
      network,
      appBar,
      toolbar
    ]);
  }

}


module.exports = Pathways;