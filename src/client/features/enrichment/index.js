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
//const downloadTypes = require('../../common/config').downloadTypes;

const enrichmentConfig={
  //extablish toolbar and declare features to not include
  toolbarButtons: _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}, {'id': 'showInfo'}],'id'),
  menus: BaseNetworkView.config.menus,
  //allow for searching of nodes
  useSearchBar: true
};

//temporary empty network for development purposes
const emptyNetwork = {
  graph: {
    edges: [],
    nodes: [],
    pathwayMetadata: {
      title: [],
      datasource: [],
      comments: []
    },
    layout: null
  }
};
const network = emptyNetwork;
const layoutConfig = getLayoutConfig();

class Enrichment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({headless: true}),
      componentConfig: enrichmentConfig,
      layoutConfig: layoutConfig,
      networkJSON: network.graph,
      networkMetadata: network.graph.pathwayMetadata,

      //temporarily set to false so loading spinner is disabled
      networkLoading: false,

      closeToolBar: true,

      validTokens: []
    };

    this.handleValidTokenChange = this.handleValidTokenChange.bind(this);
  }

  handleValidTokenChange(validTokens)
  {
    this.state.validTokens = validTokens;
    //console.log(this.state.validTokens);
  }

  render() {
    let { cy, componentConfig, layoutConfig, networkJSON, networkMetadata, networkLoading } = this.state;
    let tokenInput = () => h(TokenInput,{
        updateValidTokenList: this.handleValidTokenChange
      });

    return h(BaseNetworkView.component, {
      cy,
      componentConfig,
      layoutConfig,
      networkJSON,
      networkMetadata,
      networkLoading,
      titleContainer: () => h(tokenInput),
      //will use state to set to false to render the toolbar once analysis is run and graph is displayed
      closeToolBar: true
    });
  }
}

module.exports = Enrichment;