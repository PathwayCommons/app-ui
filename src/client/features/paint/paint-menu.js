const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const classNames = require('classnames');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const matchSorter = require('match-sorter').default;

const cysearch = _.debounce(require('../../common/cy/match-style'), 500);

const { ExpressionTable, applyExpressionData } = require('./expression-table');

class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFunction: this.analysisFns().mean,
      selectedClass: props.selectedClass,
      selectedSearchResult: props.searchResults[0].json.graph.pathwayMetadata.uri,
      loading: false
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
    const nextExpressionTable = new ExpressionTable(this.props.rawExpressions, networkJSON);
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
      expressionTable: nextExpressionTable,
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

    const selectedFunctionName = this.state.selectedFunction.name;
    const selectedFunction = this.state.selectedFunction.func;
    const selectedClass = this.state.selectedClass;

    const expressionTable = props.expressionTable;
    const foldChangeExpressions = expressionTable.expressions().map(expression => {

      const geneDisplayName = expression.replacedExpression.geneName ? `${expression.replacedExpression.geneName} (${expression.geneName})` : expression.geneName;
      return {
        geneName: geneDisplayName,
        foldChange: expression.foldChange(selectedClass, selectedFunction, 'N/A')
      };
    });

    const { min, max } = expressionTable.computeFoldChangeRange(selectedClass, selectedFunction);


    const columns = [
      {
        Header: 'Gene',
        accessor: 'geneName',
        filterMethod: (filter, rows) => {
          return matchSorter(rows, filter.value, { keys: ['geneName'] });
        },
        Filter: filter => {
          return h('input', {
            style: {
              width: '100%'
            },
            type: 'text',
            placeholder: 'Filter by gene',
            value: filter ? filter.value : '',
            onChange: e => filter.onChange(e.target.value)
          });
        },
        filterable: true,
        filterAll: true
      },
      {
        Header: 'Expression Ratio (Log2)',
        id: 'foldChange',
        accessor: 'foldChange'
      }
    ];

    const functionSelector = h('select.paint-select',
      {
        value: selectedFunctionName,
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
      return h('div', {
          onClick: e => {
            if (!this.state.loading) {
              this.setState({
                selectedSearchResult: result.json.graph.pathwayMetadata.uri
              }, () => {
                this.loadNetwork(result.json.graph);
                this.setState({
                  loading: false
                });
              });
            }
          },
          className: classNames('paint-search-result', { 'paint-search-result-selected': this.state.selectedSearchResult ===  result.json.graph.pathwayMetadata.uri})
        }, [
        h('h3', result.json.graph.pathwayMetadata.title[0]),
        h('p', result.json.graph.pathwayMetadata.dataSource[0]),
        h('p', `Genes matched: ${result.geneIntersection.length} / ${expressionTable.expressions().length} `)
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
      expressionTable.classes.map(cls => h('option', { value: cls}, cls))
      ),
      ` vs ${_.difference(expressionTable.classes, [selectedClass])}`
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
          }, 'Select Pathway')
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
          defaultPageSize: foldChangeExpressions.length,
          showPagination: false,
          defaultSorted: [{
            id: 'foldChange',
            desc: true
          }],
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