const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');

const cytoscape = require('cytoscape');
const cose = require('cytoscape-cose-bilkent');
cytoscape.use(cose);

const sbgn2Json = require('sbgnml-to-cytoscape');
const sbgnStylesheet = require('cytoscape-sbgn-stylesheet');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services/').PathwayCommonsService;

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
      enrichmentData: {},
      cy: cy,
      name: '',
      datasource: ''
    };
  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  componentDidMount() {
    const props = this.props;
    const query = queryString.parse(props.location.search);
    const enrichmentsURI = query.uri ? query.uri : null;

    if (enrichmentsURI != null) {
      fetch(enrichmentsURI).then(response => response.json()).then(enrichmentJson => this.setState({enrichmentData: enrichmentJson}));
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
        ]),
        h('div.paint-toolbar',
          JSON.stringify(state.enrichmentData, null, 4)
        )
      ]),
      h('div.paint-graph', [
        h(`div.#cy-container`, {style: {width: '100%', height: '100%'}})
      ])
    ]);
  }
}

module.exports = Paint;