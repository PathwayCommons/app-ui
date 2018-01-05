const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Table = require('react-table').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const matchSorter = require('match-sorter').default;

const cysearch = _.debounce(require('../../common/cy/search'), 500);

const { applyExpressionData, computeFoldChange, computeFoldChangeRange } = require('./expression-model');

const { ServerAPI } = require('../../services');

class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFunction: this.analysisFns().mean,
      searchResultsLoading: true,
      geneIntersectionResults: []
    };    
  }

  componentDidMount() {
    const searchResults = this.props.searchResults;

    const pathwaysJSON = searchResults.map(result => ServerAPI.getGraphAndLayout(result.uri, 'latest'));

    Promise.all(pathwaysJSON).then(results => {
      const geneIntersectionResults = results.map(pathwayJSON => {
        const genesInPathway = _.uniq(pathwayJSON.graph.nodes.map(node => node.data.label));
        const genesInExpressionData = this.props.expressionTable.rows.map(row => row.geneName);

        return {
          cyJSON: pathwayJSON.graph,
          name: pathwayJSON.graph.pathwayMetadata.title[0],
          datasource: pathwayJSON.graph.pathwayMetadata.dataSource[0],
          geneIntersection: _.intersection(genesInPathway, genesInExpressionData)
        };
      });
      this.setState({
        searchResultsLoading: false,
        geneIntersectionResults: geneIntersectionResults
      });
    });

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
      applyExpressionData(this.props.cy, this.props.expressionTable, this.props.selectedFunction);
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

    const paintSearchResults = this.state.geneIntersectionResults
    .sort((a, b) => a.geneIntersection.length < b.geneIntersection.length)
    .map(result => {
      return h('div.paint-search-result', [
        h('div', {onClick: e => this.loadNetwork(result.cyJSON)}, result.name),
        h('div', result.title),
        h('div', result.geneIntersection.join(' ')),
        h('div', `expressions found in pathway: ${result.geneIntersection.length}`)
      ]);
    });

    const searchTabContent = this.state.searchResultsLoading ? 'loading' : paintSearchResults;
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
            cysearch(cy, _.get(column, '0.value', ''), {'border-width': 8, 'border-color': 'red'});
          }
        })
      ]),
      h(TabPanel, searchTabContent)
    ]);
  }
}

module.exports = PaintMenu;