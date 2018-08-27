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
      networkEmpty: false,
      sliderVal: 0.05
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

  changeMenu( menu, cb){
    let postMenuChange = () => {
      _.throttle(() => this.state.cySrv.get().resize())();
      cb ? cb() : null;
    };

    if( menu === this.state.activeMenu ){
      this.setState({ activeMenu: 'closeMenu' }, postMenuChange );
    } else {
      this.setState({ activeMenu: menu }, postMenuChange );
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

    let updateNetworkJSON = async () => {
      let analysisResult = await ServerAPI.enrichmentAPI({ genes: genes }, "analysis");

      if( !analysisResult || !analysisResult.pathwayInfo ) {
        this.setState({ timedOut: true, loading: false });
        return;
      }

      let visualizationResult = await ServerAPI.enrichmentAPI({ pathways: analysisResult.pathwayInfo }, "visualization");

      if( !visualizationResult ) {
        this.setState({ timedOut: true, loading: false });
        return;
      }

      cy.remove('*');
      cy.add({
        edges: visualizationResult.graph.elements.edges,
        nodes: visualizationResult.graph.elements.nodes
      });

      this.changeMenu('enrichmentMenu', () => {
        if( cy.nodes().length === 0 ){
          this.setState({
            networkEmpty: true,
            loading: false,
            invalidTokens: unrecognized,
            openToolBar: true
          });
        } else {
          cy.layout(_.assign({}, ENRICHMENT_MAP_LAYOUT, {
            stop: () => {
              this.setState({
                loading: false,
                invalidTokens: unrecognized,
                openToolBar: true
              });
            }
          })).run();
        }
      });
    };

    this.changeMenu('closeMenu', () => this.setState({ loading: true, openToolbar: false, networkEmpty: false }, updateNetworkJSON));
  }

  updateSlider( sliderVal ){
    this.setState({ sliderVal: sliderVal });
  }


  render(){
    let { loading, cySrv, activeMenu, invalidTokens, openToolBar, networkEmpty, sliderVal } = this.state;

    let network = h('div.network', {
        className: classNames({
          'network-loading': loading,
          'network-sidebar-open': activeMenu !== 'closeMenu'
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
      h('a.logo-link', {href:'http://www.pathwaycommons.org'} ,[
        h('div.app-bar-logo')
      ]),
      h('div.app-bar-title', 'Pathway Enrichment'),
      h(TokenInput, { controller: this }),
      toolbar
    ]);

    let sidebar = h('div.enrichment-sidebar', [
      h(Sidebar, { controller: this, activeMenu }, [
        h(EnrichmentMenu, { key: 'enrichmentMenu', cySrv, invalidTokens, controller: this, sliderVal: sliderVal }),
        h(EnrichmentDownloadMenu, { key: 'enrichmentDownloadMenu', cySrv })
      ])
    ]);

    return h('div.main', [
      h('div', { className: classNames('menu-bar', { 'menu-bar-margin': activeMenu }) }, [
        toolbar,
        appBar
      ]),
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [ sidebar ]),
      networkEmpty ? h(EmptyNetwork, { msg: 'No results to display', showPcLink: false} ) : null,
      network
    ]);
  }
}

module.exports = Enrichment;