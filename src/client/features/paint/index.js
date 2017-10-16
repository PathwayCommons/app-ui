const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');

const cytoscape = require('cytoscape');
const sbgn2Json = require('sbgnml-to-cytoscape');
const sbgnStylesheet = require('cytoscape-sbgn-stylesheet');

const PathwayCommonsService = require('../../services/').PathwayCommonsService;

class Paint extends React.Component {
  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);
    const cy = cytoscape({
      style: sbgnStylesheet(cytoscape),
      minZoom: 0.16,
      maxZoom: 4,
      headless: true
    });

    this.state = {
      query: query,
      cy: cy,
      name: '',
      datasource: ''
    };

    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(response => {
        this.setState({
          name: response ? response.traverseEntry[0].value.pop() : ''
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        this.setState({
          datasource: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });
  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  componentDidMount() {
    const state = this.state;
    const container = document.getElementById('cy-container');
    state.cy.mount(container);

    PathwayCommonsService.query(state.query.uri, 'SBGN')
    .then(text => {
      const sbgnJson = sbgn2Json(text);
      state.cy.remove('*');
      state.cy.add(sbgnJson);
    });
  }

  render() {
    return h('div.paint', [
      h('div.paint-menu'),
      h('div.paint-graph', [
        h(`div.#cy-container`, {style: {width: '100%', height: '100%'}})
      ])
    ]);
  }
}

module.exports = Paint;