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
  let geneQueries = _.chunk(expressions.map(expression => expression.geneName), 15)
  .map(chunk => ServerAPI.querySearch({q: chunk.join(' ')}));


  let searchQuery = ServerAPI.querySearch({q: searchParam});

  return Promise.all([...geneQueries, searchQuery]).then(searchResults => {
    let uniqueResults = _.uniqBy(_.flatten(searchResults), result => result.uri);

    let pathwaysJSON = uniqueResults.map(result => ServerAPI.getPathway(result.uri, 'latest'));

    return Promise.all(pathwaysJSON).then(pathways => {
      return pathways.map( pathway => {
        let p = new Pathway();
        p.load( pathway );

        let ms = p.macromolecules();
        let genesInPathway = _.flattenDeep(_.uniq([...ms.map(node => node.data.label), ...ms.map(node => node.data.geneSynonyms)]));
        let genesInExpressiondata = expressions.map( e => e.geneName);

        return {
          pathway: p,
          geneIntersection: _.intersection(genesInPathway, genesInExpressiondata)
        };
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
      expressionTable: new ExpressionTable(),
      activeMenu: 'paintMenu',
      paintMenuCtrls: {
        exprClass: '',
        exprFnName: 'mean',
        exprFn: _.mean
      },
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
    let { cySrv, expressionTable  } = this.state;
    cySrv.mount(this.network);
    cySrv.load();
  
    fetch(enrichmentsUri).then( res => res.json() ).then( json =>  {
      let expressions = _.get(json.dataSetExpressionList, '0.expressions', []);
      expressionTable.load( json );

      let findBestPathway = results => {
        // pathway results are sorted by how many genes they have in common
        // with the expression table

        // see if there is a pathway that has the same title as the search param
        let bestResult = results.find( r => r.pathway.name() === searchParam );

        if( bestResult == null ){
          bestResult = results.sort((p0, p1) => p1.geneIntersection.length > p0.geneIntersection.length);
        }

        return bestResult;
      };

      getPathwaysRelevantTo( searchParam, expressions ).then( results => {
        let { pathway } = findBestPathway( results );
        this.setState({
          paintMenuCtrls: _.assign({}, this.state.paintMenuCtrls, { exprClass: expressionTable.classes[0] }),
          pathways: results,
          curPathway: pathway
        }, () => {
          this.loadPathway(pathway);
        });
  
      });

    } );
  }

  loadPathway(pathway){
    let { cySrv, paintMenuCtrls, expressionTable } = this.state;
    let { exprClass, exprFn } = paintMenuCtrls;
    let cy = cySrv.get();
    expressionTable.loadPathway( pathway.cyJson() );
    cy.remove('*');
    cy.add( pathway.cyJson() );

    cy.layout(_.assign({}, PATHWAYS_LAYOUT_OPTS, {
      stop: () => {
        applyExpressionData(cy, expressionTable, exprClass, exprFn);
        this.setState({loading: false });
      }
    })).run();
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
    let { loading, expressionTable, curPathway, pathways, cySrv, activeMenu, paintMenuCtrls } = this.state;


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