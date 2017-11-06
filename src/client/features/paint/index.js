const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const color = require('color');
const _ = require('lodash');

const cytoscape = require('cytoscape');
const cose = require('cytoscape-cose-bilkent');
cytoscape.use(cose);

const sbgn2Json = require('sbgnml-to-cytoscape');
const sbgnStylesheet = require('cytoscape-sbgn-stylesheet');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;


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
      cy: cy,
      name: '',
      datasource: ''
    };
  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  colorMap(value) {
    return color.hsl(value * 240 / 255, 100, 50).string();
  }

  percentToColour(percent, colourRangeStart, colourRangeEnd) {
    const hslValue = ( percent  * ( colourRangeEnd - colourRangeStart ) ) + colourRangeStart;

    return color.hsl(hslValue, 100, 50).string();
  }

  
  // only call this after you know component is mounted
  initPainter(expressionsList) {
    const expressions = _.get(expressionsList, '0.expressions', null);
    const geneNames = expressions ? expressions.map(e => e.geneName) : [];

    const state = this.state;
    const query = {
      q: geneNames.slice(0, 15).sort().join(' '),
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

            expressions.forEach(expression => {
              state.cy.nodes().filter(node => node.data('label') === expression.geneName).forEach(node => {
                const maxVal = _.max(expression.values);
                const minVal = _.min(expression.values);

                node.style({
                  'pie-size': '100%',
                  'pie-1-background-color': this.percentToColour(expression.values[0] / maxVal, 0, 240),
                  'pie-1-background-size': '50%',
                  'pie-1-background-opacity': 1,
                  'pie-2-background-color': this.percentToColour(expression.values[expression.values.length - 1] / maxVal, 0, 240),
                  'pie-2-background-size': '50%',
                  'pie-2-background-opacity': 1
                });
              });
            });

          });
        }
      });
  }

  componentDidMount() {
    const props = this.props;
    const state = this.state;
    const container = document.getElementById('cy-container');
    state.cy.mount(container);

    const query = queryString.parse(props.location.search);
    const enrichmentsURI = query.uri ? query.uri : null;
    if (enrichmentsURI != null) {
      fetch(enrichmentsURI)
        .then(response => response.json())
        .then(enrichmentDataSetJSON => {
          this.setState({
            enrichmentDataSets: enrichmentDataSetJSON.dataSetExpressionList
          }, () => {
            this.initPainter(enrichmentDataSetJSON.dataSetExpressionList);
          });
        });
    }
  }

  render() {
    const state = this.state;

    return h('div.paint', [
      h('div.paint-menu', [
        h('div.paint-logo'),
        h('h2.paint-title', 'Pathway Commons'),
        h('div.paint-graph-info', [
          h('h4.paint-graph-name', state.name),
          h('h4.paint-datasource', state.datasource)
        ]),
        h('div.paint-tab-toggle', [
          h('div.paint-view-toggle', 'Enrichment Graph'),
          h('div.paint-view-toggle', 'Enrichment Data')
        ]),
        h('div.paint-toolbar', [
          h(Icon, { className: 'paint-control-icon', icon: 'image' }),
          h(Icon, { className: 'paint-control-icon', icon: 'shuffle' }),
          h(Icon, { className: 'paint-control-icon', icon: 'help' }),
        ])
      ]),
      h('div.paint-graph', [
        h(`div.#cy-container`, {style: {width: '100%', height: '100%'}})
      ])
    ]);
  }
}

module.exports = Paint;