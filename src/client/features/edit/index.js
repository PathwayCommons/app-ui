const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');

const { BaseNetworkView, Popup } = require('../../common/components');
const { getLayoutConfig, applyHumanLayout } = require('../../common/cy/layout');
const make_cytoscape = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const LayoutHistoryMenu = require('./layout-history-menu');

const EditViewConfig = {
  menus: BaseNetworkView.config.menus.concat({
    id: 'layoutHistoryMenu',
    func: props => h(LayoutHistoryMenu, props)
  }),
  toolbarButtons: BaseNetworkView.config.toolbarButtons.concat({
      id: 'showLayoutHistory',
      icon: 'history',
      type: 'activateMenu',
      menuId: 'layoutHistoryMenu',
      description: 'Network Arrangment history'
  })
};

class Edit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true }),
      networkJSON: {},
      networkLayoutJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },

      activateWarning: true,
      warningMessage: 'Be careful! Your changes will be live.',
    
      loading: true
    };

    const query = queryString.parse(props.location.search);
    
    const cy = this.state.cy;
    cy.on('free', 'node', function(evt) {
      ServerAPI.submitNodeChange(query.uri, 'latest', evt.target.id(), evt.target.position());
    });

    ServerAPI.initReceiveNodeChange(nodePosition => {
      const node = cy.getElementById(nodePosition.nodeId);

      if (node.isChildless()) {
        node.animate({position: nodePosition.bbox}, { duration: 250 });
      }

      ServerAPI.initReceiveLayoutChange(layoutJSON => {
        applyHumanLayout(cy, layoutJSON, { duration: 250 });
      });
    });

    ServerAPI.getGraphAndLayout(query.uri, 'latest').then(networkJSON => {
      const layoutConfig = getLayoutConfig(networkJSON.layout);

      this.setState({
        componentConfig: EditViewConfig,
        layoutConfig: layoutConfig,
        networkJSON: networkJSON.graph,
        networkLayoutJSON: networkJSON.layout,
        networkMetadata: {
          uri: query.uri,
          name: _.get(networkJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
          datasource: _.get(networkJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
          comments: networkJSON.graph.pathwayMetadata.comments,
          organism: networkJSON.graph.pathwayMetadata.organism
        },
        loading: false
      });
    });
  }

  render() {
    const state = this.state;

    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkLayoutJSON: state.networkLayoutJSON,
      networkMetadata: state.networkMetadata
    }, [    ]);

    const content = state.loading ? h('div', 'Loading') : baseView;

    return h('div', [
      content,
      h(Popup, {
        active: state.activateWarning,
        deactivate: () => this.setState({ activateWarning: false }),
        duration: 5000
      }, state.warningMessage)
    ]);
  }
}

module.exports = Edit;