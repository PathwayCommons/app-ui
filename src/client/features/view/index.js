const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Graph, EditWarning, Sidebar } = require('./components/');

const getLayouts = require('../../common/cy/layout/');
const make_cytoscape = require('../../common/cy/');
const bindMove = require('../../common/cy/events/move');

const queryString = require('query-string');
const { CDC } = require('../../services/');

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(props.location.search);
    this.state = {
      query: query,

      cy: make_cytoscape({ headless: true }),
      graphJSON: null,

      layout: '',
      availableLayouts: [],

      metadata: {
        name: '',
        datasource: '',
        comments: []
      },

      activeMenu: '',

      activateWarning: this.props.admin || false,
      warningMessage: this.props.admin ? 'Be careful! Your changes are live.' : '',
    };

    CDC.getGraphAndLayout(query.uri, 'latest').then(graphJSON => {
      const layoutConf = getLayouts(graphJSON.layout);

      this.setState({
        graphJSON: graphJSON.graph,
        layout: layoutConf.defaultLayout,
        availableLayouts: layoutConf.layouts,
        metadata: {
          name: graphJSON.graph.pathwayMetadata.title[0] || 'Unknown Network',
          datasource: graphJSON.graph.pathwayMetadata.dataSource[0] || 'Unknown Data Source',
          comments: graphJSON.graph.pathwayMetadata.comments,
          organism: graphJSON.graph.pathwayMetadata.organism
        }
      });
    });
  }
  componentWillMount() {
    if (this.props.admin) {
      bindMove(this.state.query.uri, 'latest', this.state.cy);
    }
  }

  render() {
    const state = this.state;

    return h('div.View', [
      h(Menu, {
        name: state.metadata.name,
        datasource: state.metadata.datasource,
        availableLayouts: state.availableLayouts,
        currLayout: state.layout,
        cy: state.cy,
        changeLayout: layout => this.setState({layout: layout}),
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu})
      }),
      h(Graph, {
        cy: state.cy,
        graphJSON: state.graphJSON
      }),
      h(EditWarning, {
        active: state.activateWarning,
        deactivate: () => this.setState({ activateWarning: false }),
        dur: 5000
      }, state.warningMessage),
      h(Sidebar, {
        cy: state.cy,
        uri: state.query.uri,
        name: state.metadata.name,
        datasource: state.metadata.datasource,
        comments: state.metadata.comments,
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu})
      })
    ]);
  }
}

module.exports = View;