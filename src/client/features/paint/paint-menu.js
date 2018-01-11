const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const matchSorter = require('match-sorter').default;

const cysearch = _.debounce(require('../../common/cy/match-style'), 500);

const { applyExpressionData, computeFoldChange, computeFoldChangeRange } = require('./expression-model');


class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFunction: this.analysisFns().mean,
      selectedClass: props.selectedClass
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
    const updateBaseViewState = this.props.updateBaseViewState;
    const cy = this.props.cy;

    updateBaseViewState({
      networkMetadata: {
        uri: networkJSON.pathwayMetadata.uri,
        name: _.get(networkJSON, 'pathwayMetadata.title.0', 'Unknown Network'),
        datasource: _.get(networkJSON, 'pathwayMetadata.dataSource.0', 'Unknown Data Source'),
        comments: networkJSON.pathwayMetadata.comments,
        organism: networkJSON.pathwayMetadata.organism
      }
    });

    updateBaseViewState({
      networkLoading: true
    }, () => {
      cy.remove('*');
      cy.add({nodes: networkJSON.nodes, edges: networkJSON.edges});
      const layout = cy.layout({name: 'cose-bilkent'});
      layout.on('layoutstop', () => {
        applyExpressionData(this.props.cy, this.props.expressionTable, this.state.selectedClass, this.state.selectedFunction.func);
        updateBaseViewState({networkLoading: false});
      });
      layout.run();
    });
  }


  render() {
    const props = this.props;
    const cy = props.cy;

    const selectedFunction = this.state.selectedFunction.func;
    const selectedClass = this.state.selectedClass;

    const expressionTable = props.expressionTable;
    const expressionHeader = _.get(expressionTable, 'header', []);
    const foldChangeExpressions = _.get(expressionTable, 'rows', []).map(row => {
      const fv = computeFoldChange(row, selectedClass, selectedFunction).value;

      return {
        geneName: row.geneName,
        foldChange: fv === Infinity || fv === -Infinity ? 'N/A' : fv
      };
    });

    const { min, max } = computeFoldChangeRange(expressionTable, selectedClass, selectedFunction);


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
        accessor: 'foldChange'
      }
    ];

    const functionSelector = h('select.paint-select',
      {
        value: selectedFunction.name,
        onChange: e => {
          const newSelectedFunction = _.find(this.analysisFns(), (fn) => fn.name === e.target.value);
          this.setState({
            selectedFunction: newSelectedFunction
          }, () => applyExpressionData(this.props.cy, this.props.expressionTable, selectedClass, newSelectedFunction.func));
        }
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


    const classSelector = h('div', [
      'Compare: ',
      h('select.paint-select', {
        value: selectedClass,
        onChange: e => {
          const newSelectedClass = e.target.value;
          this.setState(
            {selectedClass: newSelectedClass},
            () => applyExpressionData(this.props.cy, this.props.expressionTable, newSelectedClass, selectedFunction)
          );
        }
      },
      expressionHeader.map(cls => h('option', { value: cls}, cls))
      ),
      ` vs ${_.difference(expressionHeader, [selectedClass])}`
    ]);

    return h(Tabs, [
      h('div.paint-drawer-header', [
        h(TabList, [
          h(Tab, {
            className: 'paint-drawer-tab',
            selectedClassName: 'paint-drawer-tab-selected'
            }, 'Expression Data'),
          h(Tab, {
            className: 'paint-drawer-tab',
            selectedClassName: 'paint-drawer-tab-selected'
          }, 'Search Results')
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
          data: foldChangeExpressions,
          columns: columns,
          defaultPageSize: 150,
          showPagination: false,
          onFilteredChange: (column, value) => {
            cysearch(cy, _.get(column, '0.value', ''), {'border-width': 8, 'border-color': 'red'});
          }
        })
      ]),
      h(TabPanel, paintSearchResults)
    ]);
  }
}

module.exports = PaintMenu;