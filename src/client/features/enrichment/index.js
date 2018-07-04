const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
//const Loader = require('react-loader');
//const queryString = require('query-string');

// const hideTooltips = require('../../common/cy/events/click').hideTooltips;
// const removeStyle= require('../../common/cy/manage-style').removeStyle;
const make_cytoscape = require('../../common/cy/');
// const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const TokenInput = require('./token-input');
const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const { ServerAPI } = require('../../services/');

//const downloadTypes = require('../../common/config').downloadTypes;

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
      cy: make_cytoscape({headless: true}),
      componentConfig: enrichmentConfig,
      layoutConfig: getLayoutConfig(),
      networkJSON: emptyNetworkJSON,
      networkMetadata: {
        name: [],
        datasource: [],
        comments: []
      },

      //temporarily set to false so loading spinner is disabled
      networkLoading: false,

      closeToolBar: true,
      genes: [],
      unrecognized: [],
      inputs: ""
    };

    this.handleInputs = this.handleInputs.bind(this);
    this.handleUnrecognized = this.handleUnrecognized.bind(this);
    this.handleGenes = this.handleGenes.bind(this);
  }

  handleInputs( inputs ) {
    this.setState({ inputs });
  }

  handleUnrecognized( unrecognized ) {
    this.setState({ unrecognized });
  }

  handleGenes( genes ) {
    this.setState( { genes } );
    this.updateNetworkJSON();
  }

  updateNetworkJSON(){
    ServerAPI.enrichmentAPI({
      genes: this.state.genes
     }, "analysis")
   .then( analysisResult => {
      ServerAPI.enrichmentAPI({
        pathways: analysisResult.pathwayInfo
      }, "visualization")
     .then( visualizationResult => {
        this.setState({
          networkJSON: {
            edges: visualizationResult.graph.elements.edges,
            nodes: visualizationResult.graph.elements.nodes
            }
        });
     })
     .catch(
       error => error
    );
   })
   .catch(
     error => error
   );
  }

  render() {
    let { cy, componentConfig, layoutConfig, networkJSON, networkMetadata, networkLoading } = this.state;
    let retrieveTokenInput = () => h(TokenInput,{
      inputs: this.state.inputs,
      handleInputs: this.handleInputs,
      handleUnrecognized: this.handleUnrecognized,
      unrecognized: this.state.unrecognized,
      handleGenes: this.handleGenes
    });

    return h(BaseNetworkView.component, {
      cy,
      componentConfig,
      layoutConfig,
      networkJSON,
      networkMetadata,
      networkLoading,
      titleContainer: () => h(retrieveTokenInput),
      //will use state to set to false to render the toolbar once analysis is run and graph is displayed
      closeToolBar: true
    });
  }
}

module.exports = Enrichment;