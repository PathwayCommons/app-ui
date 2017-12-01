const React = require('react');
const h = require('react-hyperscript');
const Table = require('react-table').default;

const queryString = require('query-string');
const color = require('color');
const _ = require('lodash');
const classNames = require('classnames');
const matchSorter = require('match-sorter').default;

const make_cytoscape = require('../../common/cy');
const cysearch = require('../../common/cy/search');

const Icon = require('../../common/components').Icon;
const { apiCaller, PathwayCommonsService } = require('../../services');

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
      selectedClass: null,
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
            nodeDimensionsIncludeLabels: true
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
  colourMap(val, min, max) {
    const distToMax = Math.abs(val - max);
    const distToMin = Math.abs(val - min);

    let hVal, lVal;
    if (distToMax > distToMin) {
      hVal = 240;
      lVal = ( val / Math.abs(max) ) * 100 + 20;
    } else {
      hVal = 0;
      lVal = ( val / Math.abs(max) ) * 100 - 20;
    }
    return color.hsl(hVal, 100, lVal).string();
  }

  percentToColour(percent) {
    const hslValue = ( 1 - percent ) * 240;

    return color.hsl(hslValue, 100, 50).string();
  }

  applyExpressionData() {
    const state = this.state;

    const selectedFunction = state.selectedFunction.func;
    const expressionTable = state.expressionTable;
    const selectedClass = state.selectedClass;

    const networkNodes = _.uniq(state.cy.nodes('[class="macromolecule"]').map(node => node.data('label'))).sort();

    const expressionsInNetwork = expressionTable.rows.filter(row => networkNodes.includes(row.geneName));

    const max = maxRelativeTo(expressionsInNetwork, selectedFunction);
    const min = minRelativeTo(expressionsInNetwork, selectedFunction);
    const mid = (max - min) / 2;

    expressionsInNetwork.forEach(expression => {
      // probably more efficient to add the expression data to the node field instead of interating twice
      state.cy.nodes().filter(node => node.data('label') === expression.geneName).forEach(node => {
        node.style({
          'background-color': this.percentToColour(applyAggregateFn(expression, selectedClass, selectedFunction) / max)
        });
      });
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
      }
    };
  }

  render() {
    const state = this.state;

    const selectedFunction = state.selectedFunction.func;
    const expressionTable = state.expressionTable;
    const expressions = _.get(expressionTable, 'rows', []);

    const networkNodes = state.cy.nodes().map(node => node.data('label'));
    const expressionsInNetwork = expressions.filter(row => networkNodes.includes(row.geneName));
    const expressionsNotInNetwork = _.difference(expressions, expressionsInNetwork);

    const max = maxRelativeTo(expressionsInNetwork, selectedFunction);
    const min = minRelativeTo(expressionsInNetwork, selectedFunction);

    const expressionHeader = _.get(expressionTable, 'header', []);
    const expressionRows = expressionsInNetwork.concat(expressionsNotInNetwork);

    const columns = [
      {
        Header: 'Gene Name',
        accessor: 'geneName',
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, { keys: ['geneName'] }),
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
      [
        h('option', {value: 'min'}, 'min'),
        h('option', {value: 'max'}, 'max'),
        h('option', {value: 'mean'}, 'mean')
      ]
    );

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', { 'closed': !state.drawerOpen }) }, [
          h('a', { onClick: e => this.toggleDrawer()}, [
            h(Icon, { icon: 'close'}),
          ]),
          h('div.paint-legend', [
            h('p', `low ${min}`),
            h('p', `high ${max}`)
          ]),
          functionSelector,
          h(Table, {
            className:'-striped -highlight',
            data: expressionRows,
            columns: columns,
            filterable: true,
            defaultPageSize: 150,
            getTheadThProps: (state, rowInfo, column, instance) => {
              return {
                onClick: e => {
                  if (column.id !== 'geneName') {
                    this.setState({
                      selectedClass: column.id
                    }, () => this.applyExpressionData());
                  }
                }
              };
            },
            getTdProps: (state, rowInfo, column, instance) => {
              return {
                onClick: e => {
                  const geneName = _.get(rowInfo, 'original.geneName', '');
                  cysearch(geneName, this.state.cy);
                }
              };
            }
           })
        ]),
        h(OmniBar, { name: state.name, datasource: state.datasource, onMenuClick: (e) => this.toggleDrawer() }),
        h(Network, { cy: state.cy })
      ])
    ]);
  }
}

module.exports = Paint;