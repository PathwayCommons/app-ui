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
// const InfoMenu = require('./menus/network-info-menu');
// const FileDownloadMenu = require('./menus/file-download-menu');


const { interactionsStylesheet, bindCyEvents, INTERACTIONS_LAYOUT_OPTS } = require('./cy');

let InteractionsMenu = props => h('div', 'intnMenu');
const InteractionsDownloadMenu = require('./interactions-download-menu');


class I extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet }),
      activeMenu: 'interactionsMenu',
      loading: true,
      source: queryString.parse(props.location.search).source
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { cySrv, source } = this.state;

    let initializeCytoscape = network => {
      cySrv.mount(this.network);

      let cy = cySrv.get();
      cy.remove('*');
      cy.add( network );

      let layout = cy.layout(INTERACTIONS_LAYOUT_OPTS);
      layout.on('layoutstop', () => {
        cySrv.load();
        this.setState({
          source,
          loading: false,
        });
      });
      layout.run();
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
        ref: dom => this.network = dom
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