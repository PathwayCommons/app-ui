const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');

const { Menu, Network, Sidebar } = require('./components/');
const { Popup } = require('../../common/components');

const { getLayouts, applyHumanLayout } = require('../../common/cy/layout/');
const make_cytoscape = require('../../common/cy/');
const { ServerAPI } = require('../../services/');


const updateOnMove = (cy, uri, version) => {
  cy.on('free', 'node', function(evt) {
    ServerAPI.submitNodeChange(uri, version, evt.target.id(), evt.target.position());
  });
};

const listenAndChange = (cy) => {
  ServerAPI.initReceiveNodeChange(nodePosition => {
    const node = cy.getElementById(nodePosition.nodeId);

    if (node.isChildless()) {
      node.animate({position: nodePosition.bbox}, { duration: 250 });
    }

    ServerAPI.initReceiveLayoutChange(layoutJSON => {
      applyHumanLayout(cy, layoutJSON, { duration: 250 });
    });
  });
};

const editEvents = [updateOnMove, listenAndChange];



class Edit extends React.Component {
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

      networkRendered: false,
      activeMenu: '',

      activateWarning: false,
      warningMessage: '',
    };

    for (const bindEditEvent of editEvents) {
      bindEditEvent(this.state.cy);
    }

    ServerAPI.getGraphAndLayout(query.uri, 'latest').then(graphJSON => {
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

  updateNetworkRenderStatus(rendered) {
    let activateWarning = false;
    let warningMessage = '';

    if (rendered) {
      activateWarning = true;
      warningMessage = 'Be careful! Your changes will be live.';
    }

    this.setState({
      networkRendered: true,
      activateWarning: activateWarning,
      warningMessage: warningMessage
    });
  }

  render() {
    const state = this.state;
    const props = this.props;

    return h('div.Edit', [
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
      h(Network, {
        cy: state.cy,
        graphJSON: state.graphJSON,
        updateNetworkRenderStatus: rendered => this.updateNetworkRenderStatus(rendered)
      }),
      h(Popup, {
        active: state.activateWarning,
        deactivate: () => this.setState({ activateWarning: false }),
        duration: 5000
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

module.exports = Edit;