const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const make_cytoscape = require('../../common/cy');

const { ServerAPI } = require('../../services');


const {createExpressionTable} = require('./expression-model');

const PaintViewConfig = {
  toolbarButtons: BaseNetworkView.config.toolbarButtons.concat({
    id: 'showPaintMenu',
    icon: 'format_paint',
    type: 'activateMenu',
    menuId: 'paintMenu',
    description: 'View expression data'
  }),
  menus: BaseNetworkView.config.menus
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

      enrichmentsLoading: true,
      networkLoading: true,



      // enrichment data state
      rawEnrichmentData: {},
      expressionTable: {},
      selectedClass: '',
      // selectedFunction: this.analysisFns().mean,

      // search results state
      query: '',
      searchResults: [],

    };

    const query = queryString.parse(props.location.search);
    const searchParam = query.q;
    const enrichmentsURI = query.uri;
    
    ServerAPI.querySearch({q: searchParam}).then(results => {
      const uri = _.get(results, '0.uri', null);

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
      
      this.state.cy.on('network-loaded', () => this.initPainter(expressions, expressionClasses));
    });
  }

  expressionDataToNodeStyle(value, range) {
    const [, max] = range;
    const style = {};

    if ((0 - max / 3) <= value < (0 + max / 3)) {
      style['background-color'] = 'white';
      style['background-opacity'] = 1;
      style['color'] = 'black';
    }

    if (value < (0 - max / 3)) {
      style['background-opacity'] = `${Math.abs(value / max)}`;
      style['background-color'] = 'green';
      style['color'] = 'white';
      style['text-outline-color'] = 'black';
    }

    if ((0 + max / 3) <= value ) {
      style['background-color'] = 'purple';
      style['background-opacity'] = `${value / max}`;
      style['color'] = 'white';
      style['text-outline-color'] = 'black';

    }
    return style;
  }

  computeFoldChange(expression, selectedFunction) {
    const classValues = Object.entries(expression.classValues);
    const c1Val = selectedFunction(classValues[0][1]);

    let c2Val = selectedFunction(classValues[1][1]);
    c2Val = c2Val === 0 ? c2Val = 1 : c2Val;

    let foldChange = Math.log2(c1Val / c2Val);

    return {
      geneName: expression.geneName,
      value: parseFloat(foldChange.toFixed(2))
    };
  }

  initPainter(expressions, expressionClasses) {
    const state = this.state;
    const expressionTable = createExpressionTable(expressions, expressionClasses);
    const selectedFn = _.mean;

    const geneNodes = state.cy.nodes('[class="macromolecule"]');
    const geneNodeLabels = _.uniq(geneNodes.map(node => node.data('label'))).sort();

    const expressionsInNetwork = expressionTable.rows.filter(row => geneNodeLabels.includes(row.geneName));

    const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);
    geneNodes.filter(node => !expressionLabels.includes(node.data('label'))).style({
      'background-color': 'grey',
      'color': 'grey',
      'opacity': 0.4
    });

    const foldValues = expressionsInNetwork.map(expression => this.computeFoldChange(expression, selectedFn));
    const fvs = foldValues.map(fv => fv.value);
    const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));
    const range = [-maxMagnitude, maxMagnitude];
    foldValues.forEach(fv => {
      const matchedNodes = state.cy.nodes().filter(node => node.data('label') === fv.geneName);
      const style = this.expressionDataToNodeStyle(fv.value, range);

      state.cy.batch(() => matchedNodes.style(style));
    });
  }

  render() {
    const state = this.state;

    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata
    });

    // create a view shell loading view e.g looks like the view but its not
    const content = state.enrichmentsLoading && state.networkLoading ? h('div', 'Loading') : baseView;

    return h('div', [content]);
  }
}

module.exports = Paint;