const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Network, Sidebar } = require('./components/');
const { menuButtons, networkButtons } = require('./buttons');
const menus = require('./menus');

const { getLayoutConfig } = require('../../cy/layout');
// cytoscape
// grapjson
// metadata

// probably in the future
// buttons
// events
// sidebar menus

// state
// layout config
// activeMenu

class BaseNetworkView extends React.Component {
  constructor(props) {
    super(props);

    if( process.env.NODE_ENV !== 'production' ){
      window.cy = props.cy;
    }

    const layoutConfig = getLayoutConfig(props.networkLayoutJSON);

    this.state = {
      layoutConfig: layoutConfig,
      currentLayout: layoutConfig.defaultLayout,
      activeMenu: ''
    };
  }

  render() {
    const props = this.props;
    const state = this.state;

    const initialLayoutOpts = state.layoutConfig.defaultLayout.options;

    return h('div.View', [
      h(Menu, {
        networkButtons: networkButtons,
        menuButtons: menuButtons,
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        layoutConfig: state.layoutConfig,
        cy: props.cy,
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu})
      }),
      h(Network, {
        cy: props.cy,
        networkJSON: props.networkJSON,
        initialLayoutOpts: initialLayoutOpts
      }),
      h(Sidebar, {
        cy: props.cy,
        name: props.networkMetadata.name,
        datasource: props.networkMetadata.datasource,
        comments: props.networkMetadata.comments,
        activeMenu: state.activeMenu,
        changeMenu: menu => this.setState({activeMenu: menu}),        
        menus: menus
      })
    ]);
  }
}

module.exports = BaseNetworkView;