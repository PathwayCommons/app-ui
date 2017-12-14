const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Network, Sidebar } = require('./components/');

const { getLayouts, humanLayoutDisplayName, applyHumanLayout } = require('../../cy/layout');
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

    const layoutConfig = getLayouts(props.networkLayoutJSON);

    this.state = {
      currentLayout: layoutConfig.defaultLayout,
      availableLayouts: layoutConfig.layouts,
      activeMenu: ''
    };
  }

  render() {
    const props = this.props;
    const state = this.state;

    const initialLayout =  _.find(state.availableLayouts, layout => layout.displayName === state.currentLayout).options;

    return h('div.View', [
      h(Menu, {
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        availableLayouts: state.availableLayouts,
        currentLayout: state.currentLayout,
        cy: props.cy,
        changeLayout: layout => this.setState({currentLayout: layout}),
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu})
      }),
      h(Network, {
        cy: props.cy,
        networkJSON: props.networkJSON,
        initialLayout: initialLayout
      }),
      h(Sidebar, {
        cy: props.cy,
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        comments: props.networkMetadata.comments,
        activeMenu: state.activeMenu
      })
    ]);
  }
}

module.exports = BaseNetworkView;