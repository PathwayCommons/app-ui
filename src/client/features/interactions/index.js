const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');
const classNames = require('classnames');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const InteractionsToolbar = require('./interactions-toolbar');
const Sidebar = require('../../common/components/sidebar');
const EmptyNetwork = require('../../common/components/empty-network');


const { interactionsStylesheet, INTERACTIONS_LAYOUT_OPTS, bindEvents } = require('./cy');

const InteractionsDownloadMenu = require('./interactions-download-menu');
const InteractionsMenu = require('./interactions-menu');

class Interactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet, onMount: bindEvents }),
      activeMenu: 'interactionsMenu',
      loading: true,
      sources: _.uniq(queryString.parse(props.location.search).source.split(',')),
      networkEmpty: false
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { cySrv, sources } = this.state;

    let initializeCytoscape = network => {
      cySrv.mount(this.networkDiv);

      let cy = cySrv.get();
      cy.remove('*');
      cy.add( network );

      if( network.nodes.length === 0 ){
        this.setState({
          networkEmpty: true,
          loading: false,
          activeMenu: 'closeMenu'
        });
        return;
      }

      cy.layout(_.assign({}, INTERACTIONS_LAYOUT_OPTS, {
        stop: () => {
          cySrv.load();
          this.setState({
            loading: false,
          });
        }
      })).run();
    };

    // TODO use this version of the code with a layout that supports being able to run it on a subset of the graph
    //   cy.nodes().filter( n => !n.hasClass('hidden') ).layout(_.assign({}, INTERACTIONS_LAYOUT_OPTS, {
    //     name: 'grid',
    //     stop: () => {
    //       cySrv.load();
    //       this.setState({
    //         source,
    //         loading: false,
    //       });
    //     }
    //   })).run();
    // };

    ServerAPI.getInteractionGraph({ sources: sources }).then( result => {
      initializeCytoscape( _.get(result, 'network', { nodes: [], edges: [] } ));
    });
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  changeMenu(menu){
    let resizeCyImmediate = () => this.state.cySrv.get().resize();
    let resizeCyDebounced = _.debounce( resizeCyImmediate, 500 );
    if( menu === this.state.activeMenu ){
      this.setState({ activeMenu: 'closeMenu' }, resizeCyDebounced);
    } else {
      this.setState({ activeMenu: menu }, resizeCyDebounced);
    }
  }

  render() {
    let { loading, cySrv, activeMenu, sources, networkEmpty } = this.state;

    let network = h('div.network', { className: classNames({
      'network-loading': loading,
      'network-sidebar-open': activeMenu !== 'closeMenu'
    })}, [
      h('div.network-cy', {
        ref: dom => this.networkDiv = dom
      })
    ]);

    let toolbar = h('div.app-toolbar', [
      h(InteractionsToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h('a.logo-link', {href:'http://www.pathwaycommons.org'} ,[
          h('div.app-bar-logo')
        ]),
        h('div.app-bar-title', sources.join(', ') + ' Interactions')
      ]),
      toolbar
    ]);

    let sidebar = h('div.app-sidebar', [
      h(Sidebar, {  controller: this, activeMenu }, [
        h(InteractionsMenu, { key: 'interactionsMenu', controller: this, cySrv }),
        h(InteractionsDownloadMenu, { key: 'interactionsDownloadMenu', cySrv, sources } ),
      ])
    ]);

    let content = !networkEmpty ? [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [
        appBar,
        sidebar
      ]),
      network,
    ] : [ h(EmptyNetwork, { msg: 'No interactions to display', showPcLink: true} ) ];


    return h('div.interactions', content);
  }

}


module.exports = Interactions;