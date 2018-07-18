const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const Loader = require('react-loader');
const _ = require('lodash');

const Tooltip = require('../tooltip');

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
      props.cySrv.getPromise().then(cy => window.cy = cy);
    }

    this.state = _.merge({},
      {
        activeMenu: 'closeMenu',
        nodeSearchValue: '',
        open: false,
        networkLoading: true,
        updateBaseViewState: (nextState, next) => this.setState(nextState, next ? next() : null)
      }, props);
    this.state.open = this.state.activeMenu !== 'closeMenu';
  }

  componentWillReceiveProps(nextProps){//needed to updata metadata for interactions
    this.setState({
      networkMetadata: nextProps.networkMetadata,
      filters:nextProps.filters,
      networkJSON: nextProps.networkJSON
    });
  }

  //note: cannot use setState in componentWillUpdate
  componentWillUpdate(nextProps){

    //re-render graph for enrichment app when networkJSON updated
    if(this.state.networkMetadata.name === "enrichment" && nextProps.networkJSON !== this.state.networkJSON)
    {
      const state = this.state;
      const initialLayoutOpts = _.assign({}, state.layoutConfig.defaultLayout.options, {
        animate: false // no animations on init load
      });

      const cySrv = state.cySrv;

      const cy = cySrv.get();

      cy.elements().remove();

      cy.add(nextProps.networkJSON);

      const layout = cy.layout(initialLayoutOpts);

      //set default view for filtering nodes by p_value when new network is rendered
      this.state.cySrv.loadPromise().then(() => {
        //by default, on load only display nodes w p_value < 0.025
        this.displayDefaultNodes(0.025);
      });

      layout.on('layoutstop', () => {
        cySrv.load(); // indicate loaded
      });

      layout.run();
    }
  }

    displayDefaultNodes(defaultSliderVal){
    //match position on slider with default value
    document.getElementById('enrichment-selection-slider').value = defaultSliderVal;

    const cy = this.state.cySrv.get();

    //hide nodes outside of value range
    cy.nodes().forEach(node => {
      if(node.data('p_value') > defaultSliderVal)
        node.addClass('hidden');
      else
        node.removeClass('hidden');
    });
  }

  componentWillUnmount() {
    this.state.cySrv.destroy();
  }

  componentDidMount() {
    const state = this.state;
    const initialLayoutOpts = _.assign({}, state.layoutConfig.defaultLayout.options, {
      animate: false // no animations on init load
    });
    const container = this.graphDOM;

    const cySrv = state.cySrv;

    cySrv.mount(container);

    const cy = cySrv.get();

    cy.remove('*');

    cy.add(state.networkJSON);

    const layout = cy.layout(initialLayoutOpts);

    layout.on('layoutstop', () => {
      cySrv.load(); // indicate loaded
      this.setState({networkLoading: false});
    });

    layout.run();
  }


  changeMenu(menu) {
    let resizeCyImmediate = () => this.state.cySrv.get().resize();
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
    debouncedSearchNodes(this.state.cySrv.get(), queryString);
  }

  clearSearchBox() {
    this.setState({
      nodeSearchValue: ''
    }, () => this.searchCyNodes(''));
  }


  render() {
    const state = Object.assign({}, this.state, {
      cy: this.state.cySrv.get()
    });

    const componentConfig = state.componentConfig;

    const toolbarButtons = componentConfig.toolbarButtons;
    const menus = state.componentConfig.menus;

    const activeMenu = menus.filter(menu => menu.id === state.activeMenu)[0].func(state);
    const menuWidth = menus.filter(menu => menu.id === state.activeMenu)[0].width;

    const menuButtons = toolbarButtons.filter(btn => btn.type === 'activateMenu').map(btn => {
      return (
        h(Tooltip, { description: btn.description }, [
          h('div.icon-button', {
            key: btn.id,
            onClick: () => this.changeMenu(btn.menuId),
            className: classNames({'icon-button-active': state.activeMenu === btn.menuId })
          }, [
            h('i.material-icons', btn.icon)
          ])
        ])
      );
    });

    const networkButtons = toolbarButtons.filter(btn => btn.type === 'networkAction').map(btn => {
      return (
        h(Tooltip, { description: btn.description }, [
          h('div.icon-button', {
            key: btn.id,
            onClick: () => {
              btn.func(state);
            },
            cy: state.cySrv.get()
          }, [
            h('i.material-icons', btn.icon)
          ])
        ])
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

    //display pathway and database names
    const metadataTitles = h('h4',[
      h('span', state.networkMetadata.name),
      ' | ',
      h('a', state.networkMetadata.datasource)
    ]);

    // if 'titleContainer' exists from index file, unique title will render in 'div.title-container'
    // default: metadata pathway name and database
    const displayInfo = [
      (this.props.titleContainer ?  this.props.titleContainer() : metadataTitles)
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
          h('div.title-container', displayInfo)
        ]),
        h('div.view-toolbar', {style: {display: this.props.closeToolBar == true ? 'none': 'inherit'}}, toolBar)
      ]),
      h(Loader, {
        loaded: !this.state.networkLoading,
        options: { left: '50%', color: '#16A085' },
      }),
      h('div.graph', {
          className: classNames({
            'graph-network-loading': this.state.networkLoading,
            'graph-sidebar-open': this.state.open
          }),
          style: { width: menuWidth?`${100-menuWidth}%`:'' }
        },
        [
          h('div.graph-cy', {
            ref: dom => this.graphDOM = dom,
          })
        ]
      ),
      h('div', {
        className: classNames('sidebar-menu',{'sidebar-menu-open': this.state.open }),
        style: { width: menuWidth?`${menuWidth}%`:'' }
      }, [
          h('div', {
            className: classNames('sidebar-close-button-container', { 'sidebar-close-button-container-open': this.state.open })
          }, [
            h(Tooltip, { description: 'Close the sidebar' }, [
              h('div.icon-button', {
                key: 'close',
                onClick: () => this.changeMenu('closeMenu'),
              }, [
                h('i.material-icons', 'close')
              ])
            ])
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
