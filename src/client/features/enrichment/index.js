const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Loader = require('react-loader');
//const queryString = require('query-string');

// const hideTooltips = require('../../common/cy/events/click').hideTooltips;
// const removeStyle= require('../../common/cy/manage-style').removeStyle;
const CytoscapeService = require('../../common/cy/');
const enrichmentStylesheet= require('../../common/cy/enrichment-stylesheet');
const TokenInput = require('./token-input');
const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const { ServerAPI } = require('../../services/');

const downloadTypes = require('../../common/config').downloadTypes;

const enrichmentConfig={
  //extablish toolbar and declare features to not include
  toolbarButtons: _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}, {'id': 'showInfo'}],'id'),
  menus: BaseNetworkView.config.menus,
  //allow for searching of nodes
  useSearchBar: true
};

//temporary empty network for development purposes
const emptyNetworkJSON = {
    edges: [],
    nodes: []
};


class Enrichment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cySrv: new CytoscapeService( {style: enrichmentStylesheet, showTooltipsOnEdges:true, minZoom:0.01 }),
      componentConfig: enrichmentConfig,
      layoutConfig: getLayoutConfig(),
      networkJSON: emptyNetworkJSON,

      networkMetadata: {
        name: "enrichment",
        datasource: [],
        comments: []
      },

      loaded: true,

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
    this.setState({ inputs, loaded: true });
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

      this.setState({
        closeToolBar: false,
        loaded: true,
        networkJSON: {
          edges: visualizationResult.graph.elements.edges,
          nodes: visualizationResult.graph.elements.nodes
        }
      });
    };
    updateNetworkJSON();
  }

  render() {
    let { cySrv, componentConfig, layoutConfig, networkJSON, networkMetadata, networkLoading, closeToolBar, loaded } = this.state;

    let retrieveTokenInput = () => h(TokenInput,{
      inputs: this.state.inputs,
      handleInputs: this.handleInputs,
      handleUnrecognized: this.handleUnrecognized,
      unrecognized: this.state.unrecognized,
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
    return h('div.main', [content]);
  }
}

module.exports = Enrichment;