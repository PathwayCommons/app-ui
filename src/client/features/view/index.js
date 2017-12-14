const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');

const { getLayouts } = require('../../common/cy/layout/');
const make_cytoscape = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const {BaseNetworkView} = require('../../common/components');


class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
  
      cy: make_cytoscape({ headless: true }),
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
  
      layout: 'Force Directed',
      availableLayouts: [],
  
      networkRendered: false,
    };
  
    const query = queryString.parse(props.location.search);   
  
    ServerAPI.getGraphAndLayout(query.uri, 'latest').then(networkJSON => {
    
      const layoutConf = getLayouts(networkJSON.layout);
    
      this.setState({
        networkJSON: networkJSON.graph,
        layout: layoutConf.defaultLayout,
        availableLayouts: layoutConf.layouts,
        networkMetadata: {
          name: _.get(networkJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
          datasource: _.get(networkJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
          comments: networkJSON.graph.pathwayMetadata.comments,
          organism: networkJSON.graph.pathwayMetadata.organism
        }
      });
    });
  }
  
  render() {
    const state = this.state;
    
    return h('div', [
      h(BaseNetworkView, {
        cy: state.cy,
        initialLayout: state.layout,
        availableLayouts: state.availableLayouts,
        networkJSON: state.networkJSON,
        networkMetadata: state.networkMetadata
      })
    ]);
  }
  
}

// class View extends React.Component {
//   constructor(props) {
//     super(props);
//     const query = queryString.parse(props.location.search);
//     this.state = {
//       query: query,

//       cy: make_cytoscape({ headless: true }),
//       graphJSON: null,

//       layout: '',
//       availableLayouts: [],

//       metadata: {
//         name: '',
//         datasource: '',
//         comments: []
//       },

//       networkRendered: false,
//       activeMenu: '',

//       activateWarning: false,
//       warningMessage: '',
//     };

//     ServerAPI.getGraphAndLayout(query.uri, 'latest').then(graphJSON => {
//       const layoutConf = getLayouts(graphJSON.layout);
//       this.setState({
//         graphJSON: graphJSON.graph,
//         layout: layoutConf.defaultLayout,
//         availableLayouts: layoutConf.layouts,
//         metadata: {
//           name: _.get(graphJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
//           datasource: _.get(graphJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
//           comments: graphJSON.graph.pathwayMetadata.comments,
//           organism: graphJSON.graph.pathwayMetadata.organism
//         }
//       });
//     });
//   }

//   componentWillMount() {
//     if (this.props.admin) {
//       bindMove(this.state.query.uri, 'latest', this.state.cy);
//     }
//   }

//   updateNetworkRenderStatus(rendered) {
//     let activateWarning = false;
//     let warningMessage = '';

//     if (rendered && this.props.admin) {
//       bindListenAndChange(this.state.cy);
//       activateWarning = true;
//       warningMessage = 'Be careful! Your changes will be live.';
//     }

//     this.setState({
//       networkRendered: true,
//       activateWarning: activateWarning,
//       warningMessage: warningMessage
//     });
//   }

//   render() {
//     const state = this.state;
//     const props = this.props;

//     return h('div.View', [
//       h(Menu, {
//         uri: state.query.uri,
//         admin: props.admin,
//         name: state.metadata.name,
//         datasource: state.metadata.datasource,
//         availableLayouts: state.availableLayouts,
//         currLayout: state.layout,
//         cy: state.cy,
//         changeLayout: layout => this.setState({layout: layout}),
//         activeMenu: state.activeMenu,
//         changeMenu: menu => this.setState({activeMenu: menu})
//       }),
//       h(Network, {
//         cy: state.cy,
//         graphJSON: state.graphJSON,
//         updateNetworkRenderStatus: rendered => this.updateNetworkRenderStatus(rendered)
//       }),
//       h(Popup, {
//         active: state.activateWarning,
//         deactivate: () => this.setState({ activateWarning: false }),
//         duration: 5000
//       }, state.warningMessage),
//       h(Sidebar, {
//         cy: state.cy,
//         uri: state.query.uri,
//         name: state.metadata.name,
//         datasource: state.metadata.datasource,
//         comments: state.metadata.comments,
//         activeMenu: state.activeMenu,
//         changeMenu: menu => this.setState({activeMenu: menu}),
//         changeLayout: layoutConf => this.setState({
//           layout: layoutConf.defaultLayout,
//           availableLayouts: layoutConf.layouts
//         }),
//         admin: props.admin
//       })
//     ]);
//   }
// }

module.exports = View;