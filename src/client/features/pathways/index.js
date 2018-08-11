const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');
const classNames = require('classnames');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const PathwaysToolbar = require('./pathways-toolbar');
const Sidebar = require('../../common/components/sidebar');
const InfoMenu = require('./menus/network-info-menu');
const FileDownloadMenu = require('./menus/file-download-menu');

const Pathway = require('../../models/pathway/pathway-model');

const { stylesheet, bindCyEvents, PATHWAYS_LAYOUT_OPTS } = require('./cy');

class Pathways extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: stylesheet, onMount: bindCyEvents }),
      pathway: new Pathway(),
      activeMenu: 'closeMenu',
      loading: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let { pathway, cySrv} = this.state;
    let { uri } = queryString.parse(this.props.location.search);

    let initializeCytoscape = pathway => {
      cySrv.mount(this.network);

      let cy = cySrv.get();
      cy.remove('*');
      cy.add( pathway.cyJson() );

      let layout = cy.layout(PATHWAYS_LAYOUT_OPTS);
      layout.on('layoutstop', () => {
        cySrv.load();
        this.setState({
          loading: false,
          pathway: pathway
        });
      });
      layout.run();
    };

    ServerAPI.getPathway(uri, 'latest').then( pathwayJSON => {
      pathway.load( pathwayJSON );
      initializeCytoscape( pathway );
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
    let { loading, pathway, cySrv, activeMenu } = this.state;

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
        h('div.app-bar-title', pathway.name() + ' | ' + pathway.datasource())
      ])
    ]);

    let toolbar = h('div.app-toolbar', [
      h(PathwaysToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let sidebar = h('div.app-sidebar', [
      h(Sidebar, {  controller: this, activeMenu }, [
        h(InfoMenu, { key: 'infoMenu', infoList: pathway.comments() }),
        h(FileDownloadMenu, { key: 'downloadMenu', cySrv, fileName: pathway.name(), uri: pathway.uri() }),
      ])
    ]);

    let content = [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [ appBar, toolbar ]),
      sidebar,
      network,
    ];

    return h('div.pathways', content);
  }

}


module.exports = Pathways;