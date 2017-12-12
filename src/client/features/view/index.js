const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Graph, Sidebar } = require('./components/');
const { Popup } = require('../../common/components');

const { getLayouts } = require('../../common/cy/layout/');
const make_cytoscape = require('../../common/cy/');
const bindMove = require('../../common/cy/events/move');
const bindListenAndChange = require('../../common/cy/events/listen-and-change');
const queryString = require('query-string');
const { apiCaller } = require('../../services/');

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

      graphRendered: false,
      activeMenu: '',

      activateWarning: false,
      warningMessage: '',
    };

    apiCaller.getGraphAndLayout(query.uri, 'latest').then(graphJSON => {
      const layoutConf = getLayouts(graphJSON.layout);
      this.setState({
        graphJSON: graphJSON.graph,
        layout: layoutConf.defaultLayout,
        availableLayouts: layoutConf.layouts,
        metadata: {
          name: _.get(graphJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
          datasource: _.get(graphJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
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

  updateGraphRenderStatus(bool) {
    let activateWarning = false;
    let warningMessage = '';

    if (bool && this.props.admin) {
      bindListenAndChange(this.state.cy);
      activateWarning = true;
      warningMessage = 'Be careful! Your changes will be live.';
    }

    this.setState({
      graphRendered: true,
      activateWarning: activateWarning,
      warningMessage: warningMessage
    });
  }

  render() {
    const state = this.state;
    const props = this.props;

    return h('div.View', [
      h(Menu, {
        uri: state.query.uri,
        admin: props.admin,
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
        graphJSON: state.graphJSON,
        updateGraphRenderStatus: bool => this.updateGraphRenderStatus(bool)
      }),
      h(Popup, {
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
        changeMenu: menu => this.setState({activeMenu: menu}),
        changeLayout: layoutConf => this.setState({
          layout: layoutConf.defaultLayout,
          availableLayouts: layoutConf.layouts
        }),
        admin: props.admin
      })
    ]);
  }
}

module.exports = View;