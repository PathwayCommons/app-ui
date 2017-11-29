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

const createExpressionTable = require('./expression-model');


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

  componentWillReceiveProps(nextProps) {
    if (!_.isEmpty(nextProps.expressionTable)) {
      this.applyExpressionData(nextProps);
    }
  }

  applyExpressionData(props) {
    const expressionTable = props.expressionTable;
    const expressionClasses = expressionTable.header;

    const selectedClassIndex = expressionClasses.indexOf(props.selectedClass);
    const networkNodes = _.uniq(props.cy.nodes('[class="macromolecule"]').map(node => node.data('label'))).sort();

    const expressionsInNetwork = expressionTable.rows.filter(row => networkNodes.includes(row.geneName));
    const maxVal = _.max(expressionsInNetwork.map(row => _.max(row.classValues)).map((k, v) => parseFloat(k)));
    const minVal = _.min(expressionsInNetwork.map(row => _.min(row.classValues)).map((k, v) => parseFloat(k)));

    expressionsInNetwork.forEach(expression => {
      // probably more efficient to add the expression data to the node field instead of interating twice
      props.cy.nodes().filter(node => node.data('label') === expression.geneName).forEach(node => {
        const style = {
          'background-color': this.percentToColour(expression.classValues[selectedClassIndex] / maxVal)
        };

        node.style(style);
      });
    });
  }

  render() {
    return h('div.paint-graph', [ h(`div.#cy-container`, {style: {width: '100vw', height: '100vh'}}) ]);
  }

}

class Paint extends React.Component {
  constructor(props) {
    super(props);

    const cy = make_cytoscape({headless: true});

    this.state = {
      rawEnrichmentData: {},
      expressionTable: {},
      selectedClass: null,

      cy: cy,
      name: '',
      datasource: '',
      drawerOpen: false
    };

    const query = queryString.parse(props.location.search);
    const enrichmentsURI = query.uri ? query.uri : null;

    if (enrichmentsURI != null) {
      fetch(enrichmentsURI)
        .then(response => response.json())
        .then(json => {
          this.setState({rawEnrichmentData: json});

          const expressionClasses = _.get(json.dataSetClassList, '0.classes', []);
          const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
          const searchParam = query.q;
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

    apiCaller.querySearch(query)
      .then(searchResults => {
        const uri = _.get(searchResults, '0.uri', null);

        if (uri != null) {
          apiCaller.getGraphAndLayout(uri, 'latest').then(response => {
            this.setState({
              name: _.get(response, 'graph.pathwayMetadata.title', 'N/A'),
              datasource: _.get(response, 'graph.pathwayMetadata.dataSource.0', 'N/A'),
            });

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


            const expressionTable = createExpressionTable(expressions, expressionClasses);
            const header = expressionTable.header;

            this.setState({
              selectedClass: _.get(header, '0', null),
              expressionTable: expressionTable
            });
          });
        }
    });
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  getAnalysisFunctions() {
    return [
      {
        name: 'mean',
        func: _.mean,
      },
      {
        name: 'count',
        func: _.countBy,
      },
      {
        name: 'min',
        func: _.min
      },
      {
        name: 'max',
        func: _.max
      }
    ];
  }

  render() {
    const state = this.state;

    const expressionTable = state.expressionTable;
    const expressions = _.get(expressionTable, 'rows', []);

    const networkNodes = state.cy.nodes().map(node => node.data('label'));
    const expressionsInNetwork = expressions.filter(row => networkNodes.includes(row.geneName));
    const expressionsNotInNetwork = _.difference(expressions, expressionsInNetwork);


    const maxVal = _.max(expressionsInNetwork.map(row => _.max(row.classValues)).map((k, v) => parseFloat(k)));
    const minVal = _.min(expressionsInNetwork.map(row => _.min(row.classValues)).map((k, v) => parseFloat(k)));

    const expressionHeader = _.get(expressionTable, 'header', []);
    const expressionRows = expressionsInNetwork.concat(expressionsNotInNetwork);

    const columns = [
      {
        Header: 'Gene Name',
        accessor: 'geneName',
        filterMethod: (filter, rows) => {
          return matchSorter(rows, filter.value, { keys: ["geneName"] });
        },
        filterAll: true
      }
    ].concat(expressionHeader.map((className, index) => {
      return {
        Header: className,
        id: className,
        accessor: row => row.classValues[index]
      };
    }));

    // const analysisFunctions = this.getAnalysisFunctions.map(fn => {

    // })

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', { 'closed': !state.drawerOpen }) }, [
          h('a', { onClick: e => this.toggleDrawer()}, [
            h(Icon, { icon: 'close'}),
          ]),
          h('div.paint-legend', [
            h('p', `low ${minVal}`),
            h('p', `high ${maxVal}`)
          ]),
          h('select.paint-select', [
            h('option', 'min'),
            h('option', 'max'),
            h('option', 'mean'),
            h('option', 'count'),

          ]),
          h(Table, {
            className:'-striped -highlight',
            data: expressionRows,
            columns: columns,
            filterable: true,
            defaultPageSize: 150,
            getTheadThProps: (state, rowInfo, column, instance) => {
              return {
                onClick: e => {
                  this.setState({
                    selectedClass: column.id
                  });
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
        h(Network, { cy: state.cy, expressionTable: state.expressionTable, selectedClass: state.selectedClass })
      ])
    ]);
  }
}

module.exports = Paint;