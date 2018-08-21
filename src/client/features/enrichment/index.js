const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Loader = require('react-loader');
const classNames = require('classnames');

const EnrichmentDownloadMenu = require('./enrichment-download-menu');
const EnrichmentToolbar = require('./enrichment-toolbar');
const EnrichmentMenu = require('./enrichment-menu');
const TokenInput = require('./token-input');
const EmptyNetwork = require('../../common/components/empty-network');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services');
const Sidebar = require('../../common/components/sidebar');

const { ENRICHMENT_MAP_LAYOUT, enrichmentStylesheet, bindEvents } = require('./cy');
class Enrichment extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: enrichmentStylesheet, onMount: bindEvents }),
      enrichmentMap: {
        nodes: [],
        edges: []
      },
      activeMenu: 'closeMenu',
      loading: false,
      invalidTokens: [],
      openToolBar: false,
      networkEmpty: false
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

    //close open tooltips
    cy.elements().forEach(ele => {
      const tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
        ele.scratch('_tooltip-opened', false);
      }
      ele.unselect();
    });

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
      if( cy.nodes().length === 0 ){
        this.setState({
          networkEmpty: true,
          loading: false,
          activeMenu: 'enrichmentMenu',
          invalidTokens: unrecognized,
          openToolBar: true
        });
        return;
      }

      cy.layout(_.assign({}, ENRICHMENT_MAP_LAYOUT, { stop: () => {
        this.setState({
          loading: false,
          activeMenu: 'enrichmentMenu',
          invalidTokens: unrecognized,
          openToolBar: true
        });
      }})).run();
    };

    this.setState({ loading: true, activeMenu: 'closeMenu', openToolBar: false, networkEmpty: false }, () => updateNetworkJSON());
  }


  render(){
    let { loading, cySrv, activeMenu, invalidTokens, openToolBar, networkEmpty } = this.state;

    let network = h('div.network', {
        className: classNames({
          'network-loading': loading,
          'network-sidebar-open': true
        }),
        onClick: ()=> { document.getElementById('gene-input-box').blur(); }
      },
      [
        h('div.network-cy', {
          ref: dom => this.networkDiv = dom
        })
      ]
    );

    let toolbar = openToolBar ? h('div.enrichment-app-toolbar', [
      h(EnrichmentToolbar, { cySrv, activeMenu, controller: this })
    ]) : null;

    let appBar = h('div.app-bar-branding', [
      h('i.app-bar-logo', { href: 'http://www.pathwaycommons.org/' }),
      h('div.app-bar-title', 'Pathway Enrichment'),
      h(TokenInput, { controller: this }),
      toolbar
    ]);

    let sidebar = h('div.enrichment-sidebar', [
      h(Sidebar, { controller: this, activeMenu }, [
        h(EnrichmentMenu, { key: 'enrichmentMenu', cySrv, invalidTokens }),
        h(EnrichmentDownloadMenu, { key: 'enrichmentDownloadMenu', cySrv })
      ])
    ]);

    return h('div.main', [
      h('div', { className: classNames('menu-bar', { 'menu-bar-margin': activeMenu }) }, [
        toolbar,
        appBar
      ]),
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}),
      sidebar,
      networkEmpty ? h(EmptyNetwork, { msg: 'No results to display', showPcLink: false} ) : null,
      network
    ]);
  }
}

module.exports = Enrichment;