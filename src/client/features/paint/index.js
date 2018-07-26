const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');
const Loader = require('react-loader');
const Promise = require('bluebird').Promise;

const CytoscapeService = require('../../common/cy');
const { ServerAPI } = require('../../services');

const Pathway = require('../../models/pathway/pathway-model');

const FileDownloadMenu = require('./menus/file-download-menu');
const InfoMenu = require('./menus/network-info-menu');
const PaintMenu = require('./menus/paint-menu');
const PathwaysSidebar = require('./pathways-sidebar');
const PathwaysToolbar = require('./pathways-toolbar');

const { ExpressionTable, applyExpressionData, geneIntersection } = require('./expression-table');

const { stylesheet, bindCyEvents, PATHWAYS_LAYOUT_OPTS } =  require('./cy');

// given a string of N gene names, chunk them into N / 15 subqueries and send them to pathway commons
// for each pathway in the search results
// get the pathway json for that result
// find out all the genes are in that pathway
// find all the genes in the expression data
// return the intersection between genes in (expData, p) for p in Pathway List
let getPathwaysRelevantTo = (searchParam, expressionTable) => {
  let expressions = expressionTable.rawExpressions;
  let geneQueries = _.chunk(expressions.map(expression => expression.geneName), 15)
  .map(chunk => ServerAPI.querySearch({q: chunk.join(' '), type: 'Pathway'}));


  let searchQuery = ServerAPI.querySearch({q: searchParam, type: 'Pathway'});

  return Promise.all([...geneQueries, searchQuery]).then(searchResults => {
    let uniqueResults = _.uniqBy(_.flatten(searchResults), result => result.uri);

    let pathwaysJSON = uniqueResults.map(result => ServerAPI.getPathway(result.uri, 'latest'));

    return Promise.all(pathwaysJSON).then(pathways => {
      return _.uniqWith(pathways.map( pathwayJSON => {
        let p = new Pathway();
        p.load( pathwayJSON );
        return p;
      }), (p0, p1) => _.isEqual(p0.cyJson(), p1.cyJson()));
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
      expressionTable: new ExpressionTable(),
      activeMenu: 'paintMenu',
      paintMenuCtrls: {
        exprClass: '',
        exprFnName: 'mean',
        exprFn: _.mean
      },
      activeTab: 0,
      loading: true
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    let query = queryString.parse(this.props.location.search);
    let searchParam = query.q;
    let enrichmentsUri = query.uri;
    let { cySrv, expressionTable, curPathway  } = this.state;
    cySrv.mount(this.network);
    cySrv.load();

    let getEnrichments = () => {
      return fetch(enrichmentsUri).then( res => res.json() ).then( json =>  {
        expressionTable.load( json );
      });
    };

    let findBestPathway = pathways => {
      // 1. check if there is a pathway with a name that matches the search param
      // 2. sort the pathawys by their gene intersection between the expression table

      // see if there is a pathway that has the same title as the search param
      let bestResult = pathways.find( pathway => pathway.name() === searchParam );
      if( bestResult == null ){
        bestResult = pathways[0];
      }

      if( bestResult == null ){
        return null;
      }

      return bestResult;
    };

    getEnrichments().then( () => getPathwaysRelevantTo( searchParam, expressionTable ) ).then( pathways => {

      pathways.sort((p0, p1) => geneIntersection(p1, expressionTable).length - geneIntersection(p0, expressionTable).length);
      this.setState({
        paintMenuCtrls: _.assign({}, this.state.paintMenuCtrls, { exprClass: expressionTable.classes[0] }),
        pathways: pathways,
      }, () => this.loadPathway(findBestPathway(pathways)));
    });
  }

  loadPathway(pathway){
    let { cySrv, paintMenuCtrls, expressionTable } = this.state;
    let { exprClass, exprFn } = paintMenuCtrls;
    let cy = cySrv.get();

    this.setState({
      curPathway: pathway,
      loading: true
    }, () => {
      expressionTable.loadPathway( pathway.cyJson() );
      cy.remove('*');
      cy.add( pathway.cyJson() );

      cy.layout(_.assign({}, PATHWAYS_LAYOUT_OPTS, {
        stop: () => {
          applyExpressionData(cy, expressionTable, exprClass, exprFn);
          this.setState({loading: false });
        }
      })).run();
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

  handlePaintCtrlChange(newVal) {
    this.setState({
      paintMenuCtrls: _.assign({}, this.state.paintMenuCtrls, newVal)
    }, () => {
      let { cySrv, expressionTable, paintMenuCtrls } = this.state;
      let { exprClass, exprFn } = paintMenuCtrls;
      applyExpressionData(cySrv.get(), expressionTable, exprClass, exprFn);
    });
  }

  handlePaintMenuTabChange(newTab){
    this.setState({
      activeTab: newTab
    });
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  render() {
    let { loading, expressionTable, curPathway, pathways, cySrv, activeMenu, paintMenuCtrls, activeTab } = this.state;
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
          selectedIndex: activeTab,
          controller: this,
          cySrv,
          curPathway,
          paintMenuCtrls,
          pathways,
          expressionTable
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