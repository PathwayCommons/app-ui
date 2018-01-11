const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');
const _ = require('lodash');

const IconButton = require('../icon-button');

const debouncedSearchNodes = _.debounce(require('../../cy/match-style'), 300);

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

    this.state = _.merge({},
      {
        activeMenu: 'closeMenu',
        open: false,
        networkLoading: true,
        searchOpen: false
      }, props);

  }

  componentWillUnmount() {
    this.state.cy.destroy();
  }

  componentDidMount() {
    const state = this.state;
    const initialLayoutOpts = state.layoutConfig.defaultLayout.options;
    const container = this.graphDOM;

    const cy = state.cy;
    cy.mount(container);
    cy.remove('*');
    cy.add(state.networkJSON);

    const layout = cy.layout(initialLayoutOpts);
    layout.on('layoutstop', () => {
      cy.emit('network-loaded');
      this.setState({networkLoading: false});
    });
    layout.run();
  }

  changeMenu(menu) {
    if (menu === this.state.activeMenu || menu === 'closeMenu') {
      this.setState({
        activeMenu: 'closeMenu',
        open: false
      });
    } else {
      this.setState({
        activeMenu: menu,
        open: true
      });
    }
  }

  searchCyNodes(queryString) {
    debouncedSearchNodes(this.state.cy, queryString);
  }

  clearSearchBox() {
    this.searchField.value = '';
    this.searchCyNodes('');
  }


  render() {
    const state = this.state;
    const componentConfig = state.componentConfig;

    const toolbarButtons = componentConfig.toolbarButtons;
    const menus = state.componentConfig.menus;

    const activeMenu = menus.filter(menu => menu.id === state.activeMenu)[0].func(state);

    const menuButtons = toolbarButtons.filter(btn => btn.type === 'activateMenu').map(btn => {
      return (
        h('div.sidebar-tool-button-container', [
          h(IconButton, {
            key: btn.id,
            icon: btn.icon,
            active: state.activeMenu === btn.menuId,
            onClick: () => {
              this.changeMenu(btn.menuId);
            },
            desc: btn.description
          })
        ])
      );
    });

    const networkButtons = toolbarButtons.filter(btn => btn.type === 'networkAction').map(btn => {
      return (
        h(IconButton, {
          key: btn.id,
          icon: btn.icon,
          onClick: () => {
            btn.func(state);
          },
          desc: btn.description
        })
      );
    });

    const nodeSearchBar = [
      h(IconButton, {
        icon: 'search',
        key: 'search',
        active: this.state.searchOpen,
        onClick: () => {
          !this.state.searchOpen || this.clearSearchBox();
          this.setState({ searchOpen: !this.state.searchOpen }, () => {
            if (this.state.searchOpen == true) {
              this.searchField.focus();
            }
          });
        },
        desc: 'Search entities'
      }),
      h('div', {
        className: classNames('search-nodes', { 'search-nodes-open': this.state.searchOpen }),
        onChange: e => this.searchCyNodes(e.target.value)
      }, [
          h('div.view-search-bar', [
            h('input.view-search', {
              ref: dom => this.searchField = dom,
              type: 'search',
              placeholder: 'Search entities',
            }),
            h('div.view-search-clear', {
              onClick: () => this.clearSearchBox(),
            }, [h('i.material-icons', 'close')])
          ])
        ])
    ];


    const toolBar = [
      ...menuButtons,
      ...networkButtons,
      // ...(componentConfig.useLayoutDropdown ? layoutDropdown : []), // TODO re-add dropdown for edit
      ...(componentConfig.useSearchBar ? nodeSearchBar : [])
    ];


    return h('div.View', [
      h('div', { className: classNames('menu-bar', { 'menu-bar-margin': state.activeMenu }) }, [
        h('div.menu-bar-inner-container', [
          h('div.pc-logo-container', [
            h('a', { href: 'http://www.pathwaycommons.org/' } , [
              h('img', {
                src: '/img/icon.png'
              })
            ])
          ]),
          h('div.title-container', [
            h('h4', [
              h('span', state.networkMetadata.name),
              ' | ',
              h('a', state.networkMetadata.datasource)
            ])
          ])
        ]),
        h('div.view-toolbar', toolBar)
      ]),
      h(Loader, {
        loaded: !this.state.networkLoading,
        options: { left: '50%', color: '#16A085' },
      }),
      h('div.Graph', [
        h('div', {
          ref: dom => this.graphDOM = dom,
          style: {
            width: '100vw',
            height: '100vh',
            visibility: this.state.networkLoading ? 'hidden' : undefined
          }
        })
      ]),
      h('div', {
        className: classNames('sidebar-menu', { 'sidebar-menu-open': this.state.open })
      }, [
          h('div', {
            className: classNames('sidebar-close-button-container', { 'sidebar-close-button-container-open': this.state.open })
          }, [
              h(IconButton, {
                key: 'close',
                icon: 'close',
                onClick: () => this.changeMenu('closeMenu'),
                desc: 'Close the sidebar'
              })
            ]),
          h('div.sidebar-content', [
            h('div.sidebar-resize'),
            h('div.sidebar-text', [activeMenu])
          ])
        ])
    ]);
  }
}

module.exports = BaseNetworkView;