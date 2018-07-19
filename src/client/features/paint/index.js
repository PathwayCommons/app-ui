const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');
const Loader = require('react-loader');

const CytoscapeService = require('../../common/cy');
const { ServerAPI } = require('../../services');

const Pathway = require('../../models/pathway/pathway-model');

const FileDownloadMenu = require('./menus/file-download-menu');
const InfoMenu = require('./menus/network-info-menu');
const PaintMenu = require('./menus/paint-menu');
const PathwaysSidebar = require('./pathways-sidebar');
const PathwaysToolbar = require('./pathways-toolbar');

const { ExpressionTable, applyExpressionData } = require('./expression-table');

const { stylesheet, bindCyEvents, PATHWAYS_LAYOUT_OPTS } =  require('./cy');

// given a string of N gene names, chunk them into N / 15 subqueries and send them to pathway commons
// for each pathway in the search results
// get the pathway json for that result
// find out all the genes are in that pathway
// find all the genes in the expression data
// return the intersection between genes in (expData, p) for p in Pathway List
const getPathwaysRelevantTo = (searchParam, expressions) => {

  let searchQuery = ServerAPI.querySearch({q: searchParam});

  return searchQuery.then(searchResults => {
    let uniqueResults = _.uniqBy(_.flatten(searchResults), result => result.uri);

    let pathwaysJSON = uniqueResults.map(result => ServerAPI.getPathway(result.uri, 'latest'));

    return Promise.all(pathwaysJSON).then(pathways => {
      return pathways.map( pathway => {
        let p = new Pathway();
        p.load( pathway);
        return p;
      });
    });
  });
};

class Paint extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: stylesheet, onMount: bindCyEvents }),
      pathways: [],
      curPathway: new Pathway(),
      activeMenu: 'closeMenu',
      loading: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  loadPathway(pathway){
    let { cySrv } = this.state;
    let cy = cySrv.get();
    cy.remove('*');
    cy.add( pathway.cyJson() );

    let layout = cy.layout(PATHWAYS_LAYOUT_OPTS);
    layout.on('layoutstop', () => {
      cySrv.load();
      this.setState({
        loading: false,
        curPathway: pathway
      });
    });
    layout.run();
  }

  componentDidMount(){
    let query = queryString.parse(this.props.location.search);
    let searchParam = query.q;
    let { cySrv } = this.state;

    getPathwaysRelevantTo(searchParam).then(pathways  => {
      // pathway results are sorted by gene expression intersection (largest to smallest)
      // take the largest gene intersection by default

      // see if there is a result that matches exactly
      let bestResult = pathways.find( p  => p.name() === searchParam );

      if( bestResult == null ){
        bestResult = pathways[0];
      } 

      cySrv.mount(this.network);
      this.loadPathway(bestResult);
      this.setState({
        pathways: pathways,
        curPathway: bestResult
      });
    });
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
  
  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  render() {
    let { loading, curPathway, pathways, cySrv, activeMenu } = this.state;

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
        h('div.app-bar-title', curPathway.name() + ' | ' + curPathway.datasource())
      ])
    ]);

    let toolbar = h('div.app-toolbar', [
      h(PathwaysToolbar, { cySrv, activeMenu, controller: this })
    ]);

    let sidebar = h('div.app-sidebar', [
      h(PathwaysSidebar, {  controller: this, activeMenu }, [
        h(InfoMenu, { key: 'infoMenu', infoList: curPathway.comments() } ),
        h(FileDownloadMenu, {
          key: 'downloadMenu',
          cySrv,
          fileName: curPathway.name(),
          uri: curPathway.uri()
        }),
        h(PaintMenu, {
          key: 'paintMenu',
          controller: this,
          cySrv,
          curPathway,
          pathways
        })
      ])
    ]);

    let content = [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [
        appBar,
        toolbar,
        sidebar
      ]),
      network,
    ];

    return h('div.pathways', content);
  }
}

module.exports = Paint;