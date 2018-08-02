const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Loader = require('react-loader');
const classNames = require('classnames');

const enrichmentStylesheet = require('./enrichment-stylesheet');

const EnrichmentDownloadMenu = require('./enrichment-download-menu');
const EnrichmentToolbar = require('./enrichment-toolbar');
const EnrichmentMenu = require('./enrichment-menu');
const TokenInput = require('./token-input');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services');
const Sidebar = require('../../common/components/sidebar');

const ENRICHMENT_MAP_LAYOUT = {
  name: 'cose-bilkent',
  nodeRepulsion: 300000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate:false
};

class EnrichmentMap extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: enrichmentStylesheet }),
      enrichmentMap: {
        nodes: [],
        edges: []
      },
      activeMenu: 'enrichmentMenu',
      loading: false,
      invalidTokens: []
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { cySrv } = this.state;

    cySrv.mount(this.networkDiv);
    cySrv.load();
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

  handleGeneQueryResult( result ){
    let { genes, unrecognized } = result;
    let { cySrv } = this.state;
    let cy = cySrv.get();

    const updateNetworkJSON = async () => {
      const analysisResult = await ServerAPI.enrichmentAPI({ genes: genes }, "analysis");

      if( !analysisResult || !analysisResult.pathwayInfo ) {
        this.setState({ timedOut: true, loading: false });
        return;
      }

      const visualizationResult = await ServerAPI.enrichmentAPI({ pathways: analysisResult.pathwayInfo }, "visualization");

      if( !visualizationResult ) {
        this.setState({ timedOut: true, loading: false });
        return;
      }

      cy.remove('*');
      cy.add({
        edges: visualizationResult.graph.elements.edges,
        nodes: visualizationResult.graph.elements.nodes
      });

      cy.layout(_.assign({}, ENRICHMENT_MAP_LAYOUT, { stop: () => {
        this.setState({
          loading: false,
          invalidTokens: unrecognized,
        });
      }})).run();
    };

    this.setState({ loading: true}, () => updateNetworkJSON());
  }


  render(){
    let { loading, cySrv, enrichmentMap, activeMenu, invalidTokens } = this.state;

    let network = h('div.network', { className: classNames({
      'network-loading': loading,
      'network-sidebar-open': activeMenu !== 'closeMenu'
    })}, [
      h('div.network-cy', {
        ref: dom => this.networkDiv = dom
      })
    ]);

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h('i.app-bar-logo', { href: 'http://www.pathwaycommons.org/' }),
        h('div.app-bar-title', 'Pathway Enrichment'),
        h(TokenInput, { controller: this })
      ])
    ]);

    let toolbar = h('div.app-toolbar', [
      h(EnrichmentToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let sidebar = h('div.enrichment-sidebar', [
      h(Sidebar, { controller: this, activeMenu }, [
        h(EnrichmentMenu, { key: 'enrichmentMenu', cySrv, invalidTokens }),
        h(EnrichmentDownloadMenu, { key: 'enrichmentDownloadMenu', cySrv })
      ])
    ]);

    return h('div.main', [
        appBar,
        toolbar,
        sidebar,
        h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, []),
        network
    ]);
  }
}

module.exports = EnrichmentMap;