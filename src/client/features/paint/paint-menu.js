const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const matchSorter = require('match-sorter').default;

const cysearch = _.debounce(require('../../common/cy/search'), 500);

const { applyExpressionData, computeFoldChange, computeFoldChangeRange } = require('./expression-model');


class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFunction: this.analysisFns().mean,
      selectedClass: _.get(props.expressionTable, 'header.0', [])
    };
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
      }
    };
  }

  loadNetwork(networkJSON) {
    const cy = this.props.cy;
    cy.remove('*');
    cy.add(networkJSON);
    const layout = cy.layout({name: 'cose-bilkent'});
    layout.on('layoutstop', () => {
      applyExpressionData(this.props.cy, this.props.expressionTable, this.state.selectedFunction);
    });
    layout.run();
  }


  render() {
    const props = this.props;
    const cy = props.cy;
    const expressionTable = props.expressionTable;

    const selectedFunction = this.state.selectedFunction.func;
    const expressions = _.get(expressionTable, 'rows', []);


    const networkNodeLabels = cy.nodes().map(node => node.data('label'));
    const expressionsInNetwork = expressions.filter(row => networkNodeLabels.includes(row.geneName));
    const expressionsNotInNetwork = _.difference(expressions, expressionsInNetwork);


    const { min, max } = computeFoldChangeRange(expressionTable, selectedFunction);

    const expressionHeader = _.get(expressionTable, 'header', []);
    const expressionRows = expressionsInNetwork.concat(expressionsNotInNetwork);


    const columns = [
      {
        Header: 'Gene',
        accessor: 'geneName',
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, { keys: ['geneName'] }),
        filterable: true,
        filterAll: true
      },
      {
        Header: 'log2 Fold-Change',
        id: 'foldChange',
        accessor: row => computeFoldChange(row, selectedFunction).value
      }
    ];

    const functionSelector = h('select.paint-select',
      {
        value: selectedFunction.name,
        onChange: e => this.setState({
          selectedFunction: _.find(this.analysisFns(), (fn) => fn.name === e.target.value)
        }, () => applyExpressionData(this.props.cy, this.props.expressionTable, selectedFunction))
      },
      Object.entries(this.analysisFns()).map(entry => h('option', {value: entry[0]}, entry[0]))
    );

    const paintSearchResults = props.searchResults.map(result => {
      return h('div.paint-search-result', {onClick: e => this.loadNetwork(result.json.graph)}, [
        h('div', result.name),
        h('div', result.json.graph.pathwayMetadata.dataSource[0]),
        h('div', result.json.graph.pathwayMetadata.title[0]),
        h('div', result.geneIntersection.join(' ')),
        h('div', `expressions found in pathway: ${result.geneIntersection.length}`)
      ]);
    });

    const searchTabContent = this.state.searchResultsLoading ? 'loading' : paintSearchResults;

    const classSelector = h('div', [
      'Compare: ',
      h('select.paint-select', {value: this.state.selectedClass, onChange: e => this.setState({selectedClass: e.target.value})}, expressionHeader.map(cls => h('option', { value: cls}, cls))),
      ` vs ${_.difference(expressionHeader, [this.state.selectedClass])}`
    ]);

    return h(Tabs, [
      h('div.paint-drawer-header', [
        h(TabList, [
          h(Tab, 'Expression Data'),
          h(Tab, 'Search Results')
        ])
      ]),
      h(TabPanel, [
        h('div.paint-legend', [
          h('p', `low ${min}`),
          h('p', `high ${max}`)
        ]),
        h('div.paint-expression-controls', [
          h('div.paint-function-selector', [
            'Class: ',
            functionSelector
          ]),
          h('div.paint-compare-selector', [classSelector]),
        ]),
        h(Table, {
          className:'-striped -highlight',
          data: expressionRows,
          columns: columns,
          defaultPageSize: 150,
          showPagination: false,
          onFilteredChange: (column, value) => {
            cysearch(cy, _.get(column, '0.value', ''), {'border-width': 8, 'border-color': 'red'});
          }
        })
      ]),
      h(TabPanel, searchTabContent)
    ]);
  }
}

module.exports = PaintMenu;