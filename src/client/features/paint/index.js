const React = require('react');
const h = require('react-hyperscript');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');
const matchSorter = require('match-sorter').default;

const make_cytoscape = require('../../common/cy');
const cysearch = _.debounce(require('../../common/cy/search'), 500);

const Icon = require('../../common/components').Icon;
const { apiCaller } = require('../../services');

const {createExpressionTable, minRelativeTo, maxRelativeTo, applyAggregateFn} = require('./expression-model');

class OmniBar extends React.Component {
  render() {
    const props = this.props;
    return h('div.paint-omnibar', [
      h('a', { onClick: e => props.onMenuClick(e) }, [
        h(Icon, { icon: 'menu' }, 'click')
      ]),
      h('h5', `${props.name} | ${props.datasource}`)
    ]);
  }
}

// props
// expression table
// cy
class Network extends React.Component {
  componentWillUnmount() {
    this.state.cy.destroy();
  }

  componentDidMount() {
    const props = this.props;
    const container = document.getElementById('cy-container');
    props.cy.mount(container);
  }


  render() {
    return h('div.paint-graph', [ h(`div.#cy-container`, {style: {width: '100vw', height: '100vh'}}) ]);
  }

}

class Paint extends React.Component {
  constructor(props) {
    super(props);

    const cy = make_cytoscape({headless: true});
    const query = queryString.parse(props.location.search);
    const enrichmentsURI = query.uri ? query.uri : null;

    this.state = {
      rawEnrichmentData: {},
      expressionTable: {},
      selectedClass: '',
      selectedFunction: this.analysisFns().mean,

      cy: cy,
      name: '',
      datasource: '',
      drawerOpen: false
    };

    if (enrichmentsURI != null) {
      fetch(enrichmentsURI)
        .then(response => response.json())
        .then(json => {
          const expressionClasses = _.get(json.dataSetClassList, '0.classes', []);
          const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
          const searchParam = query.q;

          this.setState({rawEnrichmentData: json});
          this.initPainter(expressions, expressionClasses, searchParam);

        });
    }
  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  // only call this after you know component is mounted
  initPainter(expressions, expressionClasses, queryParam) {
    const state = this.state;
    const query = {
      q: queryParam,
      type: 'Pathway'
    };

    apiCaller.querySearch(query).then(searchResults => {
      const uri = _.get(searchResults, '0.uri', null);

      if (uri != null) {
        const expressionTable = createExpressionTable(expressions, expressionClasses);
        const header = expressionTable.header;

        apiCaller.getGraphAndLayout(uri, 'latest').then(response => {
          state.cy.remove('*');
          state.cy.add({
            nodes: _.get(response, 'graph.nodes', []),
            edges: _.get(response, 'graph.edges', [])
          });

          state.cy.layout({
            name: 'cose-bilkent',
            randomize: false,
            nodeDimensionsIncludeLabels: true,
            nodeRepulsion: 5000 * state.cy.nodes().size()
          }).run();

          this.setState({
            selectedClass: _.get(header, '0', null),
            expressionTable: expressionTable,
            name: _.get(response, 'graph.pathwayMetadata.title', 'N/A'),
            datasource: _.get(response, 'graph.pathwayMetadata.dataSource.0', 'N/A'),
          }, () => this.applyExpressionData());
        });
      }
    });
  }

  expressionDataToNodeStyle(percent) {
    const style = {};
    if (0.26 <= percent < 0.75) {
      style['background-color'] = 'white';
      style['background-opacity'] = 1;
    }

    if (percent <= 0.25) {
      style['background-color'] = 'green';
      style['background-opacity'] = 1 - (percent / 0.25);
    }

    if (0.75 <= percent) {
      style['background-color'] = 'purple';
      style['background-opacity'] = percent / 1;
    }

    return style;
  }

  applyExpressionData() {
    const state = this.state;

    const selectedFunction = state.selectedFunction.func;
    const expressionTable = state.expressionTable;
    const selectedClass = state.selectedClass;

    const geneNodes = state.cy.nodes('[class="macromolecule"]');
    const geneNodeLabels = _.uniq(geneNodes.map(node => node.data('label'))).sort();

    const expressionsInNetwork = expressionTable.rows.filter(row => geneNodeLabels.includes(row.geneName));
    const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);

    const max = maxRelativeTo(expressionsInNetwork, selectedClass, selectedFunction);
    const min = minRelativeTo(expressionsInNetwork, selectedClass, selectedFunction);


    expressionsInNetwork.forEach(expression => {
      // probably more efficient to add the expression data to the node field instead of interating twice
      state.cy.nodes().filter(node => node.data('label') === expression.geneName).forEach(node => {
        const aggFnVal = applyAggregateFn(expression, selectedClass, selectedFunction);
        const percent = aggFnVal / max;
        const style = this.expressionDataToNodeStyle(percent);

        node.style(style);
      });
    });

    geneNodes.filter(node => !expressionLabels.includes(node.data('label'))).style({
      'background-color': 'grey',
      'color': 'grey',
      'opacity': 0.4
    });
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  analysisFns() {
    return {
      mean: {
        name: 'mean',
        func: _.mean
      },
      max: {
        name: 'max',
        func: _.max
      },
      min: {
        name: 'min',
        func: _.min
      },
      count: {
        name: 'count',
        func: (classValues) => classValues.map(cv => 1).reduce((acc, curr) => acc + curr)
      }
    };
  }

  render() {
    const state = this.state;

    const selectedFunction = state.selectedFunction.func;
    const selectedClass = state.selectedClass;
    const expressionTable = state.expressionTable;
    const expressions = _.get(expressionTable, 'rows', []);

    const networkNodes = state.cy.nodes().map(node => node.data('label'));
    const expressionsInNetwork = expressions.filter(row => networkNodes.includes(row.geneName));
    const expressionsNotInNetwork = _.difference(expressions, expressionsInNetwork);

    const max = maxRelativeTo(expressionsInNetwork, selectedClass, selectedFunction);
    const min = minRelativeTo(expressionsInNetwork, selectedClass, selectedFunction);

    const expressionHeader = _.get(expressionTable, 'header', []);
    const expressionRows = expressionsInNetwork.concat(expressionsNotInNetwork);

    const columns = [
      {
        Header: 'Gene Name',
        accessor: 'geneName',
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, { keys: ['geneName'] }),
        filterable: true,
        filterAll: true
      }
    ].concat(expressionHeader.map((className, index) => {
      return {
        Header: className,
        id: className,
        accessor: row => applyAggregateFn(row, className, selectedFunction)
      };
    }));

    const functionSelector = h('select.paint-select',
      {
        value: state.selectedFunction.name,
        onChange: e => this.setState({
          selectedFunction: _.find(this.analysisFns(), (fn) => fn.name === e.target.value)
        }, () => this.applyExpressionData())
      },
      Object.entries(this.analysisFns()).map(entry => h('option', {value: entry[0]}, entry[0]))
    );

  const classSelector = h('select.paint-select',
    {
      value: selectedClass,
      onChange: e => this.setState({
        selectedClass: e.target.value
      }, () => this.applyExpressionData())
    },
    expressionHeader.map(exprClass => h('option', { value: exprClass }, exprClass))
  );

  const searchTab = h('div', 'search');

  const tabs = h(Tabs, [
    h(TabList, [
      h(Tab, 'Expression Data'),
      h(Tab, 'Search Results')
    ]),
    h(TabPanel, [
      h('div.paint-legend', [
        h('p', `low ${min}`),
        h('p', `high ${max}`)
      ]),
      h('div.paint-expression-controls', [
      h('div.paint-function-selector', [
        'function: ',
        functionSelector
      ]),
      h('div.paint-class-selector', [
        'class: ',
        classSelector
      ]),
    ]),
    h(Table, {
      className:'-striped -highlight',
      data: expressionRows,
      columns: columns,
      defaultPageSize: 150,
      showPagination: false,
      onFilteredChange: (column, value) => {
        cysearch(_.get(column, '0.value', ''), this.state.cy, false, {'border-width': 8, 'border-color': 'red'});
      }
     })
    ]),
    h(TabPanel, 'searchTab')
  ]);

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', { 'closed': !state.drawerOpen }) }, [
          h('a', { onClick: e => this.toggleDrawer()}, [
            h(Icon, { icon: 'close'}),
          ]),
          tabs
        ]),
        h(OmniBar, { name: state.name, datasource: state.datasource, onMenuClick: (e) => this.toggleDrawer() }),
        h(Network, { cy: state.cy })
      ])
    ]);
  }
}

module.exports = Paint;