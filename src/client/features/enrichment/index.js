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

// ***** NOTE: to run /enrichment, ComponentDidMount() must be commented out in Base-Network-View.js because the graph is not yet implemented
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

      titleContainer: [],
      closeToolBar: true,
      validTokens: [],
      invalidTokens: []
    };

    this.handleValidTokenChange = this.handleValidTokenChange.bind(this);
    this.handleInvalidTokenChange = this.handleInvalidTokenChange.bind(this);
  }

  handleValidTokenChange(validTokens)
  {
    this.state.validTokens = validTokens;
  }
  handleInvalidTokenChange(invalidTokens)
  {
    this.state.invalidTokens = invalidTokens;
  }

  render() {
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      cy: state.cy,
      componentConfig: state.componentConfig,
      layoutConfig: state.layoutConfig,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      networkLoading: state.networkLoading,
      titleContainer: [
        h('h4', [
          h('span', 'Pathway Enrichment   ')
        ]),
        h('img', {
          src: '/img/humanIcon.png'
        }),
        h(TokenInput,{
          updateValidTokenList: this.handleValidTokenChange,
          updateInvalidTokenList: this.handleInvalidTokenChange
        })
      ],
      //will use state to set to false to render the toolbar once analysis is run and graph is displayed
      closeToolBar: true
    });
    return h('div.main', [baseView]);
  }
}

module.exports = Enrichment;

//NOTE: CURRENTLY ONLY RENDERS ON PAGE WHEN base-network-view.js function 'componentDidMount(){}'
//      IS COMMENTED OUT