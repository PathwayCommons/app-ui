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

const PathwaysToolbar = require('./pathways-toolbar');
const PathwaysSidebar = require('./pathways-sidebar');
const { stylesheet, bindCyEvents, DEFAULT_LAYOUT_OPTS } = require('./pathways-cy');

class Pathways extends React.Component {
  constructor(props) {
    super(props);
    let { uri } = queryString.parse(props.location.search);

    this.state = {
      cySrv: new CytoscapeService({ style: stylesheet }),
      bus: new EventEmitter(),
      pathwayMetadata: {
        uri: uri,
        name: '',
        datasource: '',
        comments: []
      },
      activeMenu: 'closeMenu',
      loading: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { pathwayMetadata, cySrv} = this.state;
    let { uri } = pathwayMetadata;

    let initializeCytoscape = graphJSON => {
      let networkDiv = this.network;
      cySrv.mount(networkDiv);
      
      let cy = cySrv.get();
      bindCyEvents(cy);

      cy.remove('*');
      cy.add(graphJSON);

      let layout = cy.layout(DEFAULT_LAYOUT_OPTS);
      layout.on('layoutstop', () => {
        cySrv.load();
        this.setState({
          pathwayMetadata: {
            name: _.get(graphJSON, 'pathwayMetadata.title.0', 'Untitled Pathway'),
            datasource: _.get(graphJSON, 'pathwayMetadata.dataSource.0', 'Unknown data source'),
            comments: _.get(graphJSON, 'pathwayMetadata.comments', [])
          },
          loading: false
        });
      });
      layout.run();
    };

    ServerAPI.getPathway(uri, 'latest').then( pathwayJSON => initializeCytoscape( pathwayJSON.graph ));
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  changeMenu(menu){
    let resizeCyImmediate = () => this.state.cySrv.get().resize();
    let resizeCyDebounced = _.debounce( resizeCyImmediate, 500 );
    if( menu === this.state.activeMenu ){
      this.setState({ activeMenu: 'closeMenu' }, resizeCyDebounced);
    } else {
      this.setState({ activeMenu: menu }, resizeCyDebounced);
    }
  }

  render() {
    let { loading, pathwayMetadata, cySrv, bus, activeMenu } = this.state;

    let network = h('div.network', { className: classNames({
      'network-loading': loading,
      'network-sidebar-open': activeMenu !== 'closeMenu'
    })}, [
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

    let toolbar = h('div.app-toolbar', [
      h(PathwaysToolbar, { cySrv, bus, activeMenu, controller: this })
    ]);

    let sidebar = h('div.app-sidebar', [
      h(PathwaysSidebar, {  controller: this, activeMenu })
    ]);

    return h('div.pathways', [
      network,
      appBar,
      toolbar,
      sidebar
    ]);
  }

}


module.exports = Pathways;