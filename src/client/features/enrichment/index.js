const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Loader = require('react-loader');
//const queryString = require('query-string');

// const hideTooltips = require('../../common/cy/events/click').hideTooltips;
// const removeStyle= require('../../common/cy/manage-style').removeStyle;
const CytoscapeService = require('../../common/cy/');
const enrichmentStylesheet = require('../../common/cy/enrichment-stylesheet');
const TokenInput = require('./token-input');
const EnrichmentMenu = require('./enrichment-menu');
const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const { ServerAPI } = require('../../services/');

const downloadTypes = require('../../common/config').downloadTypes;

//extablish toolbar and declare features to not include
const toolbarButtons = _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}, {'id': 'showInfo'}],'id');

const enrichmentMenuId = 'enrichmentMenu';
const enrichmentConfig={
  //add icon for p_value legend
  toolbarButtons: toolbarButtons.concat({
    id: 'showEnrichmentMenu',
    icon: 'info',
    type: 'activateMenu',
    menuId: 'enrichmentMenu',
    description: 'View legend'
  }),
  menus: BaseNetworkView.config.menus.concat({
    id: enrichmentMenuId,
    func: props => h(EnrichmentMenu, props)
  }),
  //allow for searching of nodes
  useSearchBar: true
};

const emptyNetworkJSON = {
    edges: [],
    nodes: []
};


class Enrichment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cySrv: new CytoscapeService( {style: enrichmentStylesheet, showTooltipsOnEdges:true, minZoom:0.01}),
      componentConfig: enrichmentConfig,
      layoutConfig: getLayoutConfig('enrichment'),
      networkJSON: emptyNetworkJSON,

      networkMetadata: {
        name: "enrichment",
        datasource: [],
        comments: []
      },

      loaded: true,
      activeMenu: 'closeMenu',
      open: false,

      closeToolBar: true,
      unrecognized: [],
      inputs: "",
      timedOut: false
    };

    this.handleInputs = this.handleInputs.bind(this);
    this.handleUnrecognized = this.handleUnrecognized.bind(this);
    this.handleGenes = this.handleGenes.bind(this);
  }

  handleInputs( inputs ) {
    this.setState({ inputs, loaded: true, activeMenu: 'closeMenu', open: false });
  }

  handleUnrecognized( unrecognized ) {
    this.setState({ unrecognized });
  }

  handleGenes( genes ) {
    const updateNetworkJSON = async () => {
      const analysisResult = await ServerAPI.enrichmentAPI({ genes: genes }, "analysis");

      if( !analysisResult || !analysisResult.pathwayInfo ) {
        this.setState({ timedOut: true, loaded: true });
        return;
      }

      const visualizationResult = await ServerAPI.enrichmentAPI({ pathways: analysisResult.pathwayInfo }, "visualization");

      if( !visualizationResult ) {
        this.setState({ timedOut: true, loaded: true });
        return;
      }

      let nodes = visualizationResult.graph.elements.nodes;
      nodes.forEach(element => { this.getPathwayOverviewData(element); });

      this.setState({
        closeToolBar: false,
        activeMenu: enrichmentMenuId,
        open: true,
        loaded: true,
        networkJSON: {
          edges: visualizationResult.graph.elements.edges,
          nodes: visualizationResult.graph.elements.nodes
        }
      });
    };
    updateNetworkJSON();
  }

  getPathwayOverviewData(node){
    node.data.parsedMetadata = [];
    let id = node.data.id;

    if(id.includes('GO')){
      ServerAPI.getGoInformation(id)
      .then(res => {
        if(res) this.pushDataToNode(node, res.results[0].definition.text, "Gene Ontology");
        else return;
      })
      .catch( err => err);
    }
    else if(id.includes('REAC')){
      ServerAPI.getReactomeInformation(id)
      .then(res => {
        if(res) this.pushDataToNode(node, res.summation[0].text, "Reactome");
        else return;
      })
      .catch( err => err);
    }
  }

  pushDataToNode(node, pathwayOverview, dbName){
      node.data.parsedMetadata.push(["Pathway Overview", pathwayOverview]);
      node.data.parsedMetadata.push([ "Database IDs", [[dbName, node.data.id.replace("REAC:", "R-HSA-")]] ]);
  }

  render() {
    let { cySrv, componentConfig, layoutConfig, networkJSON, networkMetadata, networkLoading, closeToolBar, loaded, activeMenu, open, unrecognized } = this.state;

    let retrieveTokenInput = () => h(TokenInput,{
      inputs: this.state.inputs,
      handleInputs: this.handleInputs,
      handleUnrecognized: this.handleUnrecognized,
      handleGenes: this.handleGenes
    });

    const baseView = !this.state.timedOut ?
    h(BaseNetworkView.component, {
      cySrv,
      componentConfig,
      layoutConfig,
      networkJSON,
      networkMetadata,
      networkLoading,
      closeToolBar,
      activeMenu,
      open,
      unrecognized,
      titleContainer: () => h(retrieveTokenInput),
      download: {
        types: downloadTypes.filter(ele=>ele.type==='png'||ele.type==='sif'),
        promise: () => Promise.resolve(_.map(this.state.cy.edges(),edge=> edge.data().id).sort().join('\n'))
      },
    })
    :
    h('div.no-network',[
      h('strong.title','Network currently unavailable'),
      h('a', { href: location.href },'Try a diffrent set of genes')
    ]);

    const loadingView = h(Loader, { loaded: loaded, options: { left: '50%', color: '#16A085' }});

    //display baseView or loading spinner
    const content = loaded ? baseView : loadingView;
    return h('div.main', {
      //click off input box to hide
      onClick: (e) => { if( e.target.id !== 'gene-input-box' ) document.getElementById('gene-input-box').blur(); },
      //open input onLoad if unrecognized tokens exist
      onLoad: () => { if( _.isEmpty(unrecognized) == false ) document.getElementById('gene-input-box').focus(); }
    },
    [content]);
  }
}

module.exports = Enrichment;