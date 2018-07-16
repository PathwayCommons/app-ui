const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

const { BaseNetworkView, Popup } = require('../../common/components');
const { getLayoutConfig, applyHumanLayout } = require('../../common/cy/layout');
const CytoscapeService = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const EditViewConfig = _.assign({}, BaseNetworkView.config, { useSearchBar: true});

const bindMove = (cy, uri)  => {
  cy.on('free', 'node', function(evt) {
    ServerAPI.submitNodeChange(uri, 'latest', evt.target.id(), evt.target.position());
  });
};

const bindSyncEditChanges = cy => {
  ServerAPI.initReceiveNodeChange(nodePosition => {
    const node = cy.getElementById(nodePosition.nodeID);

    if (node.isChildless()) {
      node.animate({position: nodePosition.bbox}, { duration: 250 });
    }

    ServerAPI.initReceiveLayoutChange(layoutJSON => {
      applyHumanLayout(cy, layoutJSON, { duration: 250 });
    });
  });
};


class Edit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService(),
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },

      activateWarning: false,
      warningMessage: 'Be careful! Your changes will be live.',

      loading: true
    };

    const query = queryString.parse(props.location.search);
    const cySrv = this.state.cySrv;

    cySrv.loadPromise().then(cy => {
      bindMove(cy, query.uri);
      bindSyncEditChanges(cy);

      // if there is no layout from the repsonse, assume that this is the first time editing the
      // network and submit the results of the default layout after the network has been loaded
      if (this.state.networkLayoutJSON == null) {
        const layoutPositions = {};
        cy.nodes().forEach(node => {
          layoutPositions[node.id()] = node.position();
        });
        ServerAPI.submitLayoutChange(this.state.networkMetadata.uri, 'latest', layoutPositions);
      }

      this.setState({
        activateWarning: true
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
      cySrv: state.cySrv,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata
    });

    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    const content = state.loading ? loadingView : baseView;

    return h('div', [
      content
    ]);
  }
}

module.exports = Edit;