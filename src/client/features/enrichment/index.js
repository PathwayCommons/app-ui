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
    icon: 'palette',
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

//temporary empty network for development purposes
const emptyNetworkJSON = {
    edges: [],
    nodes: []
};

// for testing purposes
// const testNetwork = {
//   edges: [
//     {data:{id: 'edge1', source:"node3", target: "node4", similarity: 3 }},
//     {data:{id: 'edge2', source:"node1", target: "node2", similarity: .4 }},
//     {data:{id: 'edge3', source:"node1", target: "node4" }},
//     {data:{id: 'edge4', source:"node2", target: "node4" }}
//   ],
//   nodes: [
//     {data: {id: "node1", description: "node1", p_value: ".01", geneCount: "100000"}},
//     {data: {id: "node2", description: "node2", p_value: ".05", geneCount: "1"}},
//     {data: {id: "node3", description: "node3", p_value: ".04", geneCount: "100"}},
//     {data: {id: "node4", description: "node4", p_value: ".025", geneCount: "500"}},
//     {data: {id: "node5", description: "node5", p_value: ".00005", geneCount: "300"}},
//     {data: {id: "node6", description: "node6", p_value: ".9999"}}
//   ]
// };


class Enrichment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cySrv: new CytoscapeService( {style: enrichmentStylesheet, showTooltipsOnEdges:true, minZoom:0.01}),
      componentConfig: enrichmentConfig,
      layoutConfig: getLayoutConfig('enrichment'),
      networkJSON: emptyNetworkJSON,
      // networkJSON: testNetwork,

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
    let { cySrv, componentConfig, layoutConfig, networkJSON, networkMetadata, networkLoading, closeToolBar, loaded, unrecognized } = this.state;

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
    return h('div.main', {
      //click off input box to hide
      onClick: (e) => { if( e.target.id !== 'gene-input-box' ) document.getElementById('gene-input-box').blur(); },
      //open input and unrecognized boxes onLoad only if unrecognized tokens exist
      onLoad: () => { if( _.isEmpty(unrecognized) == false ) document.getElementById('gene-input-box').focus(); }
    },
    [content]);
  }
}

module.exports = Enrichment;