const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');

const make_cytoscape = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const {BaseNetworkView} = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');


class View extends React.Component {
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

      loading: true
    };

    const query = queryString.parse(props.location.search);

    ServerAPI.getGraphAndLayout(query.uri, 'latest').then(networkJSON => {
      this.setState({
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

    const layoutConfig = getLayoutConfig(state.networkLayoutJSON);
    const componentConfig = BaseNetworkView.config;

    const baseView = h(BaseNetworkView.component, {
      layoutConfig: layoutConfig,
      componentConfig: componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkLayoutJSON: state.networkLayoutJSON,
      networkMetadata: state.networkMetadata
    });

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? h('div', 'Loading') : baseView;

    return h('div', [content]);
  }

}


module.exports = View;