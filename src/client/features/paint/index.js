const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const Loader = require('react-loader');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const CytoscapeService = require('../../common/cy');

const { ServerAPI } = require('../../services');


const { ExpressionTable, applyExpressionData } = require('./expression-table');
const PaintMenu = require('./paint-menu');


const demoExpressions = require('./demo-expressions.json');
const demoPathways = require('./demo-pathway-results.json');


const paintMenuId = 'paintMenu';
const PaintViewConfig = {
  toolbarButtons: BaseNetworkView.config.toolbarButtons.concat({
    icon: 'format_paint',
    id: 'showPaintMenu',
    type: 'activateMenu',
    menuId: 'paintMenu',
    description: 'View expression data'
  }),
  menus: BaseNetworkView.config.menus.concat({
    id: paintMenuId,
    func: props => h(PaintMenu, props)
  }),
  useSearchBar: false
};

const getAugmentedSearchResults = (searchParam, expressions) => {
  const geneQueries = _.chunk(expressions.map(expression => expression.geneName), 15)
  .map(chunk => ServerAPI.querySearch({q: chunk.join(' ')}));

  const searchQuery = ServerAPI.querySearch({q: searchParam});

  return Promise.all([...geneQueries, searchQuery]).then(searchResults => {
    const uniqueResults = _.uniqBy(_.flatten(searchResults), result => result.uri);

    const pathwaysJSON = uniqueResults.map(result => ServerAPI.getGraphAndLayout(result.uri, 'latest'));

    return Promise.all(pathwaysJSON).then(pathways => {
      const processed = pathways.map(pathway => {
        const macromolecules = pathway.graph.nodes.filter(node => node.data.class === 'macromolecule');
        const genesInPathway = _.flattenDeep(_.uniq([...macromolecules.map(node => node.data.label), ...macromolecules.map(node => node.data.geneSynonyms)]));
        const genesInExpressionData = expressions.map(expression => expression.geneName);

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

    if (enrichmentsURI == null || searchParam == null) {
      const network = demoPathways[0].json;
      const demoExpressionTable = new ExpressionTable(demoExpressions, network.graph);
      const layoutConfig = getLayoutConfig(network.layout);
      const componentConfig = PaintViewConfig;

      this.state = {
        cySrv: new CytoscapeService(),
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
        rawExpressions: demoExpressions,
        expressionTable: demoExpressionTable,
        selectedClass: _.get(demoExpressionTable.classes, '0', ''),
        expressionsLoading: false,
        searchParam: searchParam,
        searchResults: demoPathways,

        selectedSearchResult: network.graph.pathwayMetadata.uri,
        selectedFunction: {
          name: 'mean',
          func: _.mean
        }

      };

      const selectedFn = this.state.selectedFunction.func;
      const selectedClass = this.state.selectedClass;

      this.state.cySrv.loadPromise().then(cy => applyExpressionData(cy, demoExpressionTable, selectedClass, selectedFn));
    } else {
      fetch(enrichmentsURI)
      .then(res => res.json())
      .then(json => {
        const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);

        getAugmentedSearchResults(searchParam, expressions).then(pathwayResults => {

          // pathway results are sorted by gene expression intersection (largest to smallest)
          // take the largest gene intersection by default

          // see if there is a result that matches exactly
          let candidatePathway = _.find(pathwayResults, pathway => pathway.json.graph.pathwayMetadata.title[0] === searchParam);

          if (candidatePathway == null) {
            candidatePathway = pathwayResults.sort((p0, p1) => p1.geneIntersection.length - p0.geneIntersection.length)[0];
          }

          const network = candidatePathway.json;

          const expressionTable = new ExpressionTable(json, candidatePathway.json.graph);
          const layoutConfig = getLayoutConfig(network.layout);
          const componentConfig = PaintViewConfig;

          this.setState({
            cySrv: new CytoscapeService(),
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
            rawExpressions: json,
            expressionTable: expressionTable,
            selectedClass: _.get(expressionTable.classes, '0', ''),
            expressionsLoading: false,
            searchParam: searchParam,
            searchResults: pathwayResults,

            selectedSearchResult: candidatePathway.json.graph.pathwayMetadata.uri

            }, () => {
              const selectedFn = this.state.selectedFunction.func;
              const selectedClass = this.state.selectedClass;
              applyExpressionData(this.state.cy, expressionTable, selectedClass, selectedFn);
          });
        });
      });
    }
  }

  render() {
    const state = this.state;

    const baseView = h(BaseNetworkView.component, {
      // generic base view props
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cySrv: state.cySrv,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,

      // paint specific props needed by the paint menu
      rawExpressions: state.rawExpressions,
      expressionTable: state.expressionTable,
      selectedFunction: state.selectedFunction,
      selectedClass: state.selectedClass,
      activeMenu: paintMenuId,

      searchParam: state.searchParam,
      searchResults: state.searchResults,
      selectedSearchResult: state.selectedSearchResult

    });

    const loadingView = h(Loader, { loaded: !(state.expressionsLoading || state.networkLoading), options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.expressionsLoading || state.networkLoading ? loadingView : baseView;

    return h('div', [content]);
  }
}

module.exports = Paint;