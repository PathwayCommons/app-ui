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


const { interactionsStylesheet, bindCyEvents, INTERACTIONS_LAYOUT_OPTS } = require('./cy');

let InteractionsMenu = props => h('div', 'intnMenu');
const InteractionsDownloadMenu = require('./interactions-download-menu');


const INTERACTION_TYPES = {
  BINDING: 'Binding',
  PHOSPHORYLATION: 'Phosphorylation',
  EXPRESSION: 'Expression'
};

const NODE_FILTER_THRESHOLD = 15; // filer nodes if num nodes larger than this number
const NUM_NODES_TO_FILTER = 35;    // filter the 35 'smallest' nodes 

class I extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet }),
      activeMenu: 'interactionsMenu',
      loading: true,
      source: queryString.parse(props.location.search).source,
      showBindings: true,
      showPhosphorylations: true,
      showExpressions: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { cySrv, source } = this.state;

    let initializeCytoscape = network => {
      cySrv.mount(this.networkDiv);
      let cy = cySrv.get();
      cy.remove('*');
      cy.add( network );

      if( cy.nodes().length > NODE_FILTER_THRESHOLD ){
        (
          cy.nodes()
            .sort( (n0, n1) => n0.data('metric') - n1.data('metric') )
            .slice(0, NUM_NODES_TO_FILTER)
            .addClass('hidden')
        );
      }

    // cy.layout(_.assign({}, INTERACTIONS_LAYOUT_OPTS, {
    //     stop: () => {
    //       cySrv.load();
    //       this.setState({
    //         source,
    //         loading: false,
    //       });  
    //     }
    //   })).run();
    // };

      cy.nodes().filter( n => !n.hasClass('hidden') ).layout(_.assign({}, INTERACTIONS_LAYOUT_OPTS, {
        stop: () => {
          cySrv.load();
          this.setState({
            source,
            loading: false,
          });  
        }
      })).run();
    };

    ServerAPI.getInteractionGraph({ sources: source }).then( result => {
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
    let { loading, cySrv, activeMenu, source } = this.state;

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
        h('div.app-bar-title', source + ' Interactions')
      ])
    ]);

    let toolbar = h('div.app-toolbar', [
      h(InteractionsToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let sidebar = h('div.app-sidebar', [
      h(Sidebar, {  controller: this, activeMenu }, [
        h(InteractionsMenu, { key: 'interactionsMenu' }),
        h(InteractionsDownloadMenu, { key: 'interactionsDownloadMenu', cySrv, source } ),
      ])
    ]);

    let content = [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}),
      appBar,
      toolbar,
      sidebar,
      network,
    ];

    return h('div.pathways', content);
  }

}


module.exports = I;