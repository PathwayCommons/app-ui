const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

const make_cytoscape = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');


class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      loading: true
    };

    const query = queryString.parse(props.location.search);

    ServerAPI.getGraphAndLayout(query.uri, 'latest').then(networkJSON => {
      const layoutConfig = getLayoutConfig(networkJSON.layout);
      if(query.removeInfoMenu){
        BaseNetworkView.config.toolbarButtons.splice(
          _.findIndex(BaseNetworkView.config.toolbarButtons, entry=>entry.id==='showInfo'),1
        );
      }

      const componentConfig = _.merge({},BaseNetworkView.config, { useSearchBar: true});
      this.setState({
        componentConfig: componentConfig,
        layoutConfig: layoutConfig,
        networkJSON: networkJSON.graph,
        networkMetadata: {
          uri: query.uri,
          name: query.title || _.get(networkJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
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
      networkMetadata: state.networkMetadata
    });
    
    //If the network is empty, display an error message
    if(Object.keys(state.networkJSON).length !== 0 && state.networkJSON.edges.length < 1 && state.networkJSON.nodes.length < 1){
      return h("div.emptyNetwork",{style:{textAlign:"center"}},[
        h("img",{src:"/img/icon.png",style:{height:"auto",width:"5%",padding:"20px 0px 0px 0px"}}),
        h('h1',state.networkMetadata.name + " from " + state.networkMetadata.datasource + " is an empty network"),
        h("a",{href:"http://apps.pathwaycommons.org",style:{color:"blue"}},"Return to PC Home")
      ]);
    }

    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});
    
    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;

    return h('div', [content]);
  }

}


module.exports = View;