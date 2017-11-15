const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const color = require('color');
const _ = require('lodash');
const classNames = require('classnames');

const cytoscape = require('cytoscape');
const cose = require('cytoscape-cose-bilkent');
cytoscape.use(cose);

const sbgn2Json = require('sbgnml-to-cytoscape');
const sbgnStylesheet = require('cytoscape-sbgn-stylesheet');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;

const augmentEnrichmentData = require('./enrichment-model');


class Paint extends React.Component {
  constructor(props) {
    super(props);

    const cy = cytoscape({
      style: sbgnStylesheet(cytoscape),
      minZoom: 0.16,
      maxZoom: 4,
      headless: true
    });

    this.state = {
      enrichmentDataSets: [],
      enrichmentClasses: [],
      enrichmentTable: [],
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
        
        const enrichmentTable = augmentEnrichmentData(json.dataSetClassList, json.dataSetExpressionList);
        const searchParam = query.q ? query.q : 'S Phase';
        this.initPainter(enrichmentTable, searchParam);

        console.log(json);
        
        this.setState({
          enrichmentClasses: json.dataSetClassList,
          enrichmentDataSets: json.dataSetExpressionList,
          enrichmentTable: enrichmentTable
        });
      });
    }
  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  componentDidMount() {
    const props = this.props;
    const state = this.state;
    const container = document.getElementById('cy-container');
    state.cy.mount(container);
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  percentToColour(percent) {
    const hslValue = ( 1 - percent ) * 240;

    return color.hsl(hslValue, 100, 50).string();
  }

  // only call this after you know component is mounted
  initPainter(enrichmentTable, queryParam) {
    const state = this.state;
    const query = {
      q: queryParam,
      gt: 2,
      lt: 100,
      type: 'Pathway',
      datasource: 'reactome'
    };

    PathwayCommonsService.querySearch(query)
      .then(searchResults => {
        const uri = _.get(searchResults, '0.uri', null);
        if (uri != null) {
          PathwayCommonsService.query(uri, 'json', 'Named/displayName')
          .then(response => {
            this.setState({
              name: response ? response.traverseEntry[0].value.pop() : ''
            });
          });

        PathwayCommonsService.query(uri, 'json', 'Entity/dataSource/displayName')
          .then(responseObj => {
            this.setState({
              datasource: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
            });
          });

        PathwayCommonsService.query(uri, 'SBGN')
          .then(text => {
            const sbgnJson = sbgn2Json(text);
            state.cy.remove('*');
            state.cy.add(sbgnJson);
            state.cy.layout({
              name: 'cose-bilkent',
              nodeDimensionsIncludeLabels: true
            }).run();

            const maxVal = _.max(enrichmentTable.map(entry => _.max(entry.values.map(values => values.value))));
            const classes = _.uniq(_.get(state.enrichmentClasses, '0.classes', []));

            console.log(state.enrichmentClasses);
            console.log(enrichmentTable);
            enrichmentTable.forEach(row => {
              state.cy.nodes().filter(node => node.data('label') === row.geneName).forEach(node => {

                const numSlices = classes.length > 4 ? 4 : classes.length;

                const pieStyle = {
                  'pie-size': '100%'
                };
                for (let i = 1; i <= numSlices; i++) {

                  const classValue = _.mean(row.values.filter(val => val.class === classes[i-1]));

                  pieStyle['pie-' + i + '-background-size'] = 100 / numSlices;
                  pieStyle['pie-' + i + '-background-opacity'] = 1;
                  pieStyle['pie-' + i + '-background-color'] = this.percentToColour(classValue / maxVal);
                }

                node.style(pieStyle);
              });

            });
          });
        }
      });
  }

  render() {
    const state = this.state;

    const enrichmentTable = state.enrichmentTable;
    const enrichmentTableHeader = [h('th', '')].concat(_.get(enrichmentTable, 'header', []).map(column => h('th', column)));
    const enrichmentTableRows = _.sortBy(
      _.get(enrichmentTable, 'rows', []), (o) => o.geneName
    ).map(row => h('tr',[h('td', row.geneName)].concat(row.classValues.map(cv => h('td', cv)))));

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', !state.drawerOpen ? 'closed' : '') }, [
          h('a', { onClick: e => this.toggleDrawer()}, [
            h(Icon, { icon: 'close'}),
          ]),
          h('div.paint-legend', [
            h('p', 'low'),
            h('p', 'high')
          ]),
          h('p', `columns correspond to the clockwise direction on the pie (first column starts at 12 O'Clock going clockwise)`),
          h('table', [
            h('thead', [
              h('tr', enrichmentTableHeader)
            ]),
            h('tbody', enrichmentTableRows)
          ])

        ]),
        h('div.paint-omnibar', [
          h('a', { onClick: e => this.toggleDrawer() }, [
            h(Icon, { icon: 'menu' }, 'click')
          ]),
          h('h5', `${state.name} | ${state.datasource}`)
        ]),
        h('div.paint-graph', [
          h(`div.#cy-container`, {style: {width: '100vw', height: '100vh'}})
        ])
      ])
    ]);
  }
}

module.exports = Paint;