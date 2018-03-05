const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');
const _ = require('lodash');
const hideTooltips = require('../../cy/events/click').hideTooltips;
const removeStyle = require('../../cy/manage-style').removeStyle;
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
        savedCatagories: new Map (),
        buttons:new Map([['Binding',false],
                        ['Phosphorylation',false],
                        ['Expression',false]
                      ]),
        settingChange: this.settingChange.bind(this),
        activeMenu: 'closeMenu',
        nodeSearchValue: '',
        open: false,
        networkLoading: true,
        searchOpen: false,
        updateBaseViewState: (nextState, next) => this.setState(nextState, next ? next() : null)
      }, props);

    this.state.open = this.state.activeMenu !== 'closeMenu';
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
    cy.emit('trim');
    const layout = cy.layout(initialLayoutOpts);
    layout.on('layoutstop', () => {
      cy.emit('network-loaded');
      this.setState({networkLoading: false});
    });
    layout.run();
  }
  changeMenu(menu) {
    let resizeCyImmediate = () => this.state.cy.resize();
    let resizeCyDebounced = _.debounce( resizeCyImmediate, 500 );

    if (menu === this.state.activeMenu || menu === 'closeMenu') {
      this.setState({
        activeMenu: 'closeMenu',
        open: false
      }, resizeCyImmediate);
    } else {
      this.setState({
        activeMenu: menu,
        open: true
      }, resizeCyDebounced);
    }
  }

  searchCyNodes(queryString) {
    debouncedSearchNodes(this.state.cy, queryString);
  }

  clearSearchBox() {
    this.setState({
      nodeSearchValue: ''
    }, () => this.searchCyNodes(''));
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
          desc: btn.description,
          cy: state.cy
        })
      );
    });

    const nodeSearchBarInput = h('div.view-search-bar', [
      h('input.view-search', {
        ref: dom => this.searchField = dom,
        value: this.state.nodeSearchValue,
        type: 'search',
        placeholder: 'Search entities',
      }),
      this.state.nodeSearchValue === '' ? null : h('div.view-search-clear', {onClick: () => this.clearSearchBox()}, [ // check if the search bar is empty
        h('i.material-icons', 'close')
      ])
    ]);


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
        onChange: e => {
          this.setState({
            nodeSearchValue: e.target.value
          });
          this.searchCyNodes(e.target.value);
        }
      }, [nodeSearchBarInput])
    ];




    const toolBar = [
      ...menuButtons,
      ...networkButtons,
      // ...(componentConfig.useLayoutDropdown ? layoutDropdown : []), // TODO re-add dropdown for edit
      ...(componentConfig.useSearchBar ? nodeSearchBar : [])
    ];


    return h('div.view', [
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
      h('div.graph', {
          className: classNames({
            'graph-network-loading': this.state.networkLoading,
            'graph-sidebar-open': this.state.open && this.state.activeMenu!='interactionsFilterMenu',
            'graph-sidebar-small-open': this.state.activeMenu==='interactionsFilterMenu'
          }),
        },
        [
          h('div.graph-cy', {
            ref: dom => this.graphDOM = dom,
          })
        ]
      ),
      h('div', {
        className: classNames('sidebar-menu', { 'sidebar-menu-open': this.state.open,'sidebar-menu-small':this.state.activeMenu==='interactionsFilterMenu' })
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
