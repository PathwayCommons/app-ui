const React = require('react');
const h = require('react-hyperscript');

const { Menu, Network, Sidebar } = require('./components/');

// props
// cytoscape
// grapjson
// metadata

// probably in the future
// buttons
// events
// sidebar menus

// state
// currentLayout
// availableLayouts
// activeMenu

class BaseNetworkView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentLayout: props.initialLayout,
      availableLayouts: props.availableLayouts,
      activeMenu: ''
    };
  }

  render() {
    const props = this.props;
    const state = this.state;

    return h('div.View', [
      h(Menu, {
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        availableLayouts: props.availableLayouts,
        currentLayout: state.currentLayout,
        cy: props.cy,
        changeLayout: layout => this.setState({currentLayout: layout}),
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu})
      }),
      h(Network, {
        cy: props.cy,
        networkJSON: props.networkJSON,
        updateNetworkRenderStatus: rendered => null
      }),
      h(Sidebar, {
        cy: props.cy,
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        comments: props.networkMetadata.comments,
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu}),
        changeLayout: layoutConf => this.setState({
          layout: layoutConf.defaultLayout,
          availableLayouts: layoutConf.layouts
        }),
      })
    ]);
  }
}

module.exports = BaseNetworkView;