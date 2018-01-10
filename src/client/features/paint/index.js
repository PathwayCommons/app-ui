const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const Loader = require('react-loader');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const make_cytoscape = require('../../common/cy');

const { ServerAPI } = require('../../services');


const {createExpressionTable, applyExpressionData} = require('./expression-model');
const PaintMenu = require('./paint-menu');

const PaintViewConfig = {
  toolbarButtons: BaseNetworkView.config.toolbarButtons.concat({
    id: 'showPaintMenu',
    icon: 'format_paint',
    type: 'activateMenu',
    menuId: 'paintMenu',
    description: 'View expression data'
  }),
  menus: BaseNetworkView.config.menus.concat({
    id: 'paintMenu',
    func: props => h(PaintMenu, props)
  }),
  useSearchBar: false
};

// determine the "best" pathway based on user query
// THIS MOST LIKELY SHOULD BE A SERVER SIDE CALL
// const getAugmentedSearchResults = (searchParam, expressionTable) => {
//   return ServerAPI.querySearch({q: searchParam}).then(results => {

//     const pathwaysJSON = results.map(result => ServerAPI.getGraphAndLayout(result.uri, 'latest'));

//     return Promise.all(pathwaysJSON).then(pathways => {
//       const processed = pathways.map(pathway => {
//         const genesInPathway = _.uniq(pathway.graph.nodes.map(node => node.data.label));
//         const genesInExpressionData = expressionTable.rows.map(row => row.geneName);

//         return {
//           json: pathway,
//           geneIntersection: _.intersection(genesInPathway, genesInExpressionData)
//         };
//       });

//       return processed;
//     });
//   });
// };

const getAugmentedSearchResults = (searchParam, expressionTable) => {
  const geneQueries = _.chunk(expressionTable.rows.map(row => row.geneName), 15)
  .map(chunk => ServerAPI.querySearch({q: chunk.join(' ')}));

  const searchQuery = ServerAPI.querySearch({q: searchParam});

  return Promise.all([...geneQueries, searchQuery]).then(searchResults => {
    const uniqueResults = _.uniqBy(_.flatten(searchResults), result => result.uri);

    const pathwaysJSON = uniqueResults.map(result => ServerAPI.getGraphAndLayout(result.uri, 'latest'));

    return Promise.all(pathwaysJSON).then(pathways => {
      const processed = pathways.map(pathway => {
        const genesInPathway = _.uniq(pathway.graph.nodes.map(node => node.data.label));
        const genesInExpressionData = expressionTable.rows.map(row => row.geneName);

        return {
          json: pathway,
          geneIntersection: _.intersection(genesInPathway, genesInExpressionData)
        };
      });

      return processed;
    });
  });
};

class Paint extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cy: make_cytoscape({headless: true}),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },

      expressionsLoading: true,
      networkLoading: true,

      // enrichment data state
      expressionTable: {},
      selectedClass: '',
      selectedFunction: {
        name: 'mean',
        func: _.mean
      },

      // search results state
      searchParam: '',
      searchResults: [],

    };

    const query = queryString.parse(props.location.search);
    const searchParam = query.q;
    const enrichmentsURI = query.uri;

    fetch(enrichmentsURI)
    .then(res => res.json())
    .then(json => {
      const expressionClasses = _.get(json.dataSetClassList, '0.classes', []);
      const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
      const expressionTable = createExpressionTable(expressions, expressionClasses);

      getAugmentedSearchResults(searchParam, expressionTable).then(pathwayResults => {

        // pathway results are sorted by gene expression intersection (largest to smallest)
        // take the largest gene intersection by default
        let candidatePathway = pathwayResults.sort((p0, p1) => p1.geneIntersection.length - p0.geneIntersection.length)[0];

        const network = candidatePathway.json;
        const layoutConfig = getLayoutConfig(network.layout);
        const componentConfig = PaintViewConfig;

        this.setState({
          componentConfig: componentConfig,
          layoutConfig: layoutConfig,
          networkJSON: network.graph,
          networkMetadata: {
            uri: network.graph.pathwayMetadata.uri,
            name: _.get(network, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
            datasource: _.get(network, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
            comments: network.graph.pathwayMetadata.comments,
            organism: network.graph.pathwayMetadata.organism
          },
          networkLoading: false,
          expressionTable: expressionTable,
          selectedClass: _.get(expressionClasses, '0', ''),
          expressionsLoading: false,
          searchParam: searchParam,
          searchResults: pathwayResults

        }, () => {
          const selectedFn = this.state.selectedFunction.func;
          const selectedClass = this.state.selectedClass;
          this.state.cy.on('network-loaded', () => applyExpressionData(this.state.cy, expressionTable, selectedClass, selectedFn));
        });
      });

    });
  }

  render() {
    const state = this.state;

    const baseView = h(BaseNetworkView.component, {
      // generic base view props
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,

      // paint specific props needed by the paint menu
      expressionTable: state.expressionTable,
      selectedFunction: state.selectedFunction,
      selectedClass: state.selectedClass,

      searchParam: state.searchParam,
      searchResults: state.searchResults

    });

    const loadingView = h(Loader, { loaded: !(state.expressionsLoading || state.networkLoading), options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.expressionsLoading || state.networkLoading ? loadingView : baseView;

    return h('div', [content]);
  }
}

module.exports = Paint;