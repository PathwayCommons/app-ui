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
const OmniBar = require('./omnibar');
const Network = require('./network');

class Paint extends React.Component {
  constructor(props) {
    super(props);

    const cy = make_cytoscape({headless: true});
    const query = queryString.parse(props.location.search);
    const enrichmentsURI = query.uri ? query.uri : null;

    this.state = {
      // enrichment data state
      rawEnrichmentData: {},
      expressionTable: {},
      selectedClass: '',
      selectedFunction: this.analysisFns().mean,

      // sbgn / cy network state
      cy: cy,
      name: '',
      datasource: '',

      // search results state
      query: '',
      searchResults: [],

      // drawer
      drawerOpen: false
    };

    if (enrichmentsURI != null) {
      fetch(enrichmentsURI)
        .then(response => response.json())
        .then(json => {
          const expressionClasses = _.get(json.dataSetClassList, '0.classes', []);
          const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
          const searchParam = query.q;

          this.setState({
            rawEnrichmentData: json,
            query: query.q
          });
          this.initPainter(expressions, expressionClasses, searchParam);

        });
    }
  }

  loadSbgn(uri) {
    const state = this.state;
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
        name: _.get(response, 'graph.pathwayMetadata.title', 'N/A'),
        datasource: _.get(response, 'graph.pathwayMetadata.dataSource.0', 'N/A'),
      }, () => this.applyExpressionData());
    });
  }

  // only call this after you know component is mounted
  initPainter(expressions, expressionClasses, queryParam) {
    const state = this.state;
    const query = {
      q: queryParam,
      type: 'Pathway'
    };


    // const uri = 'http://identifiers.org/reactome/R-HSA-5389840';

    // if (uri != null) {
    //   const expressionTable = createExpressionTable(expressions, expressionClasses);
    //   const header = expressionTable.header;

    //   apiCaller.getGraphAndLayout(uri, 'latest').then(response => {
    //     state.cy.remove('*');
    //     state.cy.add({
    //       nodes: _.get(response, 'graph.nodes', []),
    //       edges: _.get(response, 'graph.edges', [])
    //     });


    //     if (!_.isEmpty(response.layout)) {
    //       state.cy.layout({
    //         name: 'preset',
    //         positions: node => response.layout[node.id()],
    //         animate: true,
    //         animationDuration: 500

    //       }).run();
    //     } else {
    //       state.cy.layout({
    //         name: 'cose-bilkent',
    //         randomize: false,
    //         nodeDimensionsIncludeLabels: true,
    //         nodeRepulsion: 5000 * state.cy.nodes().size()
    //       }).run();
    //     }

    //     this.setState({
    //       selectedClass: _.get(header, '0', null),
    //       expressionTable: expressionTable,
    //       name: _.get(response, 'graph.pathwayMetadata.title', 'N/A'),
    //       datasource: _.get(response, 'graph.pathwayMetadata.dataSource.0', 'N/A'),
    //       // searchResults: searchResults
    //     }, () => this.applyExpressionData());
    //   });
    // }

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


          if (!_.isEmpty(response.layout)) {
            state.cy.layout({
              name: 'preset',
              positions: node => response.layout[node.id()],
              animate: true,
              animationDuration: 500

            }).run();
          } else {
            state.cy.layout({
              name: 'cose-bilkent',
              randomize: false,
              nodeDimensionsIncludeLabels: true,
              nodeRepulsion: 5000 * state.cy.nodes().size()
            }).run();
          }

          this.setState({
            selectedClass: _.get(header, '0', null),
            expressionTable: expressionTable,
            name: _.get(response, 'graph.pathwayMetadata.title', 'N/A'),
            datasource: _.get(response, 'graph.pathwayMetadata.dataSource.0', 'N/A'),
            searchResults: searchResults
          }, () => this.applyExpressionData());
        });
      }
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
    const c2Val = selectedFunction(classValues[1][1]);

    let foldChange = Math.log2(c1Val / c2Val);
    if (foldChange === -Infinity || foldChange === Infinity ) { foldChange = null; }

    return {
      geneName: expression.geneName,
      value: foldChange
    };
  }

  applyExpressionData() {
    const state = this.state;

    const selectedFunction = state.selectedFunction.func;
    const expressionTable = state.expressionTable;

    const geneNodes = state.cy.nodes('[class="macromolecule"]');
    const geneNodeLabels = _.uniq(geneNodes.map(node => node.data('label'))).sort();

    const expressionsInNetwork = expressionTable.rows.filter(row => geneNodeLabels.includes(row.geneName));

    const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);
    geneNodes.filter(node => !expressionLabels.includes(node.data('label'))).style({
      'background-color': 'grey',
      'color': 'grey',
      'opacity': 0.4
    });

    const foldValues = expressionsInNetwork.map(expression => this.computeFoldChange(expression, selectedFunction));
    const fvs = foldValues.map(fv => fv.value);
    const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));
    const range = [-maxMagnitude, maxMagnitude];
    foldValues.forEach(fv => {
      const matchedNodes = state.cy.nodes().filter(node => node.data('label') === fv.geneName);
      const style = this.expressionDataToNodeStyle(fv.value, range);

      state.cy.batch(() => matchedNodes.style(style));
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
        func: (classValues) => classValues.length
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


    const foldValues = expressionsInNetwork.map(expression => this.computeFoldChange(expression, selectedFunction));
    const fvs = foldValues.map(fv => fv.value);
    const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));
    const max =  maxMagnitude;
    const min = -maxMagnitude;


    const expressionHeader = _.get(expressionTable, 'header', []);
    const expressionRows = expressionsInNetwork.concat(expressionsNotInNetwork);

    const columns = [
      {
        Header: 'Gene Name',
        accessor: 'geneName',
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, { keys: ['geneName'] }),
        filterable: true,
        filterAll: true
      },
      {
        Header: 'log2 Fold-Change',
        id: 'foldChange',
        accessor: row => this.computeFoldChange(row, selectedFunction).value
      }
    ];

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

    const tabbedContent = h(Tabs, [
      h('div.paint-drawer-header', [
        h(TabList, [
          h(Tab, 'Expression Data'),
          h(Tab, 'Search Results')
        ]),
        h('a', { onClick: e => this.toggleDrawer()}, [
          h(Icon, { icon: 'close'}),
        ])
      ]),
      h(TabPanel, [
        h('div.paint-legend', [
          h('p', `low ${min}`),
          h('p', `high ${max}`)
        ]),
        h('div.paint-expression-controls', [
        h('div.paint-function-selector', [
          'class: ',
          functionSelector
        ]),
        h('div.paint-compare-selector', [
          `compare: ${expressionHeader[0]} vs ${expressionHeader[1]}`,
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
      h(TabPanel, state.searchResults.map(searchResult => {
          const uri = _.get(searchResult, 'uri', null);
          const name = _.get(searchResult, 'name', 'N/A');
          return h('div.paint-search-result', [
            h('a.plain-link', {onClick: e => this.loadSbgn(uri)}, name)
          ]);
        })
      )
    ]);

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', { 'closed': !state.drawerOpen }) }, [
          tabbedContent
        ]),
        h(OmniBar, { title: `${state.name} | ${state.datasource}`, onMenuClick: (e) => this.toggleDrawer() }),
        h(Network, { cy: state.cy })
      ])
    ]);
  }
}

module.exports = Paint;