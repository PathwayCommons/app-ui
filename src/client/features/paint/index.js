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
      rawEnrichmentData: {},
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

    ServerAPI.querySearch({q: searchParam}).then(results => {
      const uri = _.get(results, '0.uri', null);

      this.setState({
        searchParam: searchParam,
        searchResults: results
      });

      ServerAPI.getGraphAndLayout(uri, 'latest').then(networkJSON => {
        const layoutConfig = getLayoutConfig(networkJSON.layout);
        const componentConfig = PaintViewConfig;

        this.setState({
          componentConfig: componentConfig,
          layoutConfig: layoutConfig,
          networkJSON: networkJSON.graph,
          networkMetadata: {
            uri: uri,
            name: _.get(networkJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
            datasource: _.get(networkJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
            comments: networkJSON.graph.pathwayMetadata.comments,
            organism: networkJSON.graph.pathwayMetadata.organism
          },
          networkLoading: false
        });
      });
    });

    fetch(enrichmentsURI)
    .then(res => res.json())
    .then(json => {
      const expressionClasses = _.get(json.dataSetClassList, '0.classes', []);
      const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);

      this.initPainter(expressions, expressionClasses);
    });
  }

  initPainter(expressions, expressionClasses) {
    const state = this.state;
    const expressionTable = createExpressionTable(expressions, expressionClasses);
    this.setState({
      expressionTable: expressionTable,
      expressionsLoading: false
    });


    const selectedFn = state.selectedFunction.func;

    this.state.cy.on('network-loaded', () => applyExpressionData(this.state.cy, expressionTable, selectedFn));
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