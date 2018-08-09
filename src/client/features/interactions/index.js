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


const { interactionsStylesheet, INTERACTIONS_LAYOUT_OPTS } = require('./cy');

const InteractionsDownloadMenu = require('./interactions-download-menu');
const InteractionsMenu = require('./interactions-menu');


const NODE_FILTER_THRESHOLD = 15; // filer nodes if num nodes larger than this number
const NUM_NODES_TO_FILTER = 35;    // filter the 35 'smallest' nodes

class Interactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet }),
      activeMenu: 'interactionsMenu',
      loading: true,
      sources: _.uniq(queryString.parse(props.location.search).source.split(',')),
      showBindings: true,
      showPhosphorylations: true,
      showExpressions: true
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

    // hide the smallest nodes and their edges according to 'metric'
    if( cy.nodes().length > NODE_FILTER_THRESHOLD ){
      let nodesToHide = cy.nodes().sort( (n0, n1) => n0.data('metric') - n1.data('metric') ).slice(0, NUM_NODES_TO_FILTER);

      nodesToHide.union(nodesToHide.connectedEdges()).addClass('metric-hidden');
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
      initializeCytoscape( result.network );
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
    let { loading, cySrv, activeMenu, sources } = this.state;

    let network = h('div.network', { className: classNames({
      'network-loading': loading,
      'network-sidebar-open': activeMenu !== 'closeMenu'
    })}, [
      h('div.network-cy', {
        ref: dom => this.networkDiv = dom
      })
    ]);

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h('i.app-bar-logo', { href: 'http://www.pathwaycommons.org/' }),
        h('div.app-bar-title', sources.join(', ') + ' Interactions')
      ])
    ]);

    let toolbar = h('div.app-toolbar', [
      h(InteractionsToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let sidebar = h('div.app-sidebar', [
      h(Sidebar, {  controller: this, activeMenu }, [
        h(InteractionsMenu, { key: 'interactionsMenu', controller: this, cySrv }),
        h(InteractionsDownloadMenu, { key: 'interactionsDownloadMenu', cySrv, sources } ),
      ])
    ]);

    let content = [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [
        sidebar
      ]),
      appBar,
      toolbar,
      network,
    ];

    return h('div.interactions', content);
  }

}


module.exports = Interactions;