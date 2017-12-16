const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const matchSorter = require('match-sorter').default;

const cysearch = _.debounce(require('../../common/cy/search'), 500);

const { applyExpressionData, computeFoldChange } = require('./expression-model');

class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFunction: this.analysisFns().mean
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
  

  render() {

    const selectedFunction = this.state.selectedFunction.func;
    const expressionTable = this.props.expressionTable;
    const expressions = _.get(expressionTable, 'rows', []);
    const cy = this.props.cy;

    
    const networkNodes = cy.nodes().map(node => node.data('label'));
    const expressionsInNetwork = expressions.filter(row => networkNodes.includes(row.geneName));
    const expressionsNotInNetwork = _.difference(expressions, expressionsInNetwork);


    const foldValues = expressionsInNetwork.map(expression => computeFoldChange(expression, selectedFunction));
    const fvs = foldValues.map(fv => fv.value);
    const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));
    const max =  maxMagnitude;
    const min = -maxMagnitude;

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
        accessor: row => computeFoldChange(row, _.mean).value
      }
    ];

    const functionSelector = h('select.paint-select',
      {
        value: selectedFunction.name,
        onChange: e => this.setState({
          selectedFunction: _.find(this.analysisFns(), (fn) => fn.name === e.target.value)
        }, () => applyExpressionData(this.props.cy, this.props.expressionTable, this.props.selectedFunction))
      },
      Object.entries(this.analysisFns()).map(entry => h('option', {value: entry[0]}, entry[0]))
    );

    // const classSelector = h('select.paint-select',
    //   {
    //     value: selectedClass,
    //     onChange: e => this.setState({
    //       selectedClass: e.target.value
    //     }, () => this.applyExpressionData())
    //   },
    //   expressionHeader.map(exprClass => h('option', { value: exprClass }, exprClass))
    // );
    return h(Tabs, [
      h('div.paint-drawer-header', [
        h(TabList, [
          h(Tab, 'Expression Data'),
          // h(Tab, 'Search Results')
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
        h('div.paint-compare-selector', [
          `Compare: ${expressionHeader[0]} vs ${expressionHeader[1]}`,
        ]),
      ]),
      h(Table, {
        className:'-striped -highlight',
        data: expressionRows,
        columns: columns,
        defaultPageSize: 150,
        showPagination: false,
        onFilteredChange: (column, value) => {
          cysearch(_.get(column, '0.value', ''), cy, false, {'border-width': 8, 'border-color': 'red'});
        }
      })
      ])
    ]);
  }
}

module.exports = PaintMenu;