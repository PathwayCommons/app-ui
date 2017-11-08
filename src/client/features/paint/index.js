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
      cy: cy,
      name: '',
      datasource: '',
      drawerOpen: false
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
  initPainter(expressions, queryParam) {
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
        .then(json => {
          this.setState({
            enrichmentClasses: _.get(json.dataSetClassList, '0.classes', []),
            enrichmentDataSets: json.dataSetExpressionList
          }, () => {
            const expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
            const searchParam = query.q ? query.q : '';
            this.initPainter(expressions, searchParam);
          });
        });
    }
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  render() {
    const state = this.state;

    const enrichmentClassesData = Object.entries(_.countBy(state.enrichmentClasses))
      .map(entry => {
        return h('p', `class: ${entry[0]}, number of samples: ${entry[1]}`);
      });

    return h('div.paint', [
      h('div.paint-content', [
        h('div', { className: classNames('paint-drawer', !state.drawerOpen ? 'closed' : '') }, [
          h('a', { onClick: e => this.toggleDrawer()}, [
            h(Icon, { icon: 'close'})
          ]),
        ].concat(enrichmentClassesData)),
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