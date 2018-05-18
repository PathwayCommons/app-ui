const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');
const hideTooltips = require('../../common/cy/events/click').hideTooltips;
const removeStyle= require('../../common/cy/manage-style').removeStyle;
const make_cytoscape = require('../../common/cy/');
const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const { ServerAPI } = require('../../services/');
const FilterMenu= require('./filter-menu');
const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const downloadTypes = require('../../common/config').downloadTypes;

const filterMenuId='filter-menu';
const interactionsConfig={
  toolbarButtons: _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}],'id').concat({
    id: 'filter',
    icon: 'filter_list',
    type: 'activateMenu',
    menuId: filterMenuId,
    description: 'Filter interaction types'
  }),
  menus: BaseNetworkView.config.menus.concat({
    id: filterMenuId,
    width: 25, //%
    func: props => h(FilterMenu, props)
  }),
  useSearchBar: true
};

class Interactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true, stylesheet: interactionsStylesheet, showTooltipsOnEdges:true, minZoom:0.01 }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      ids:[],
      loaded:{network:false, ids:false},
      categories: new Map (),
      filters:{
        Binding:true,
        Phosphorylation:true,
        Expression:true
      }
    };

    const query = queryString.parse(props.location.search);
    const sources=_.uniq(_.concat([],query.source));
    const kind = sources.length>1?'PATHSBETWEEN':'Neighborhood';
    ServerAPI.getNeighborhood(sources,kind).then(res=>{
      const layoutConfig = getLayoutConfig('interactions');
      const network= this.parse(res);
      this.setState({
        componentConfig: interactionsConfig,
        layoutConfig: layoutConfig,
        networkJSON: network,
        loaded:_.assign(this.state.loaded,{network:true})
      });
    });
    //get ids from uris
    const geneIds = sources.map(source=>
      source.includes('pathwaycommons')?
      ServerAPI.pcQuery('traverse',{uri:source,path:`${_.last(source.split('/')).split('_')[0]}/displayName`}).then(result=>result.json())
      .then(id=> _.words(id.traverseEntry[0].value[0]).length===1 ? id.traverseEntry[0].value[0].split('_')[0] : ''):
      source.replace(/\//g,' ')
    );
    Promise.all(geneIds).then(geneIds=>{
      ServerAPI.geneQuery({genes:geneIds.join(' '),target: 'NCBIGENE'}).then(result=>{
        const ncbiIds=result.geneInfo.map(gene=> gene.convertedAlias);
        ServerAPI.getGeneInformation(ncbiIds).then(result=>{
          const geneResults=result.result;
          let hgncIds=[];
          let comments=[];
          if(!result.esummaryresult ){
            comments=_.flatten(geneResults.uids.map(gene=>{
              hgncIds.push(geneResults[gene].name);
              return _.compact([
                'Nomenclature Name: '+geneResults[gene].nomenclaturename,
                'Other Aliases: '+geneResults[gene].name + (geneResults[gene].otheraliases ? ', '+geneResults[gene].otheraliases:''),
                geneResults[gene].summary && 'Function: '+geneResults[gene].summary
              ]);
            }));
          }
          this.setState({
            networkMetadata: {
              name: hgncIds.length === sources.length ?(hgncIds+' Interactions'):' Interactions',
              datasource: 'Pathway Commons',
              comments: comments
            },
            ids:hgncIds,
            loaded:_.assign(this.state.loaded,{ids:true})
          });
        });
      });
    });

    this.state.cy.on('trim', () => {
      const state = this.state;
      const ids = state.ids;
      if(ids.length === sources.length){
        const cy = state.cy;
        const mainNode = cy.nodes(node=> ids.indexOf(node.data().id) != -1);
        const nodesToKeep = mainNode.merge(mainNode.connectedEdges().connectedNodes());
        cy.remove(cy.nodes().difference(nodesToKeep));
      }
    });

    this.state.cy.one('layoutstop',()=>{
      const state = this.state;
      const cy = this.state.cy;
      const categories = state.categories;
      const filters=state.filters;
      _.forEach(filters,(value,type)=>{
        const edges = cy.edges().filter(`.${type}`);
        const nodes = edges.connectedNodes();
        edges.length?
        categories.set(type,{edges:edges,nodes:nodes}):
        (categories.delete(type),delete filters[type]);
      });

      _.tail(_.toPairs(filters)).map(pair=>this.filterUpdate(pair[0]));
      this.setState({
        categories:categories,
        filters:filters
      });
      const initialLayoutOpts = state.layoutConfig.defaultLayout.options;
      const layout = cy.layout(initialLayoutOpts);
      layout.run();
    });
  }

  edgeType(type){
    switch(type){
      case 'in-complex-with':
      case 'interacts-with':
        return 'Binding';
      case 'controls-phosphorylation-of':
        return 'Phosphorylation';
      case 'controls-expression-of':
        return 'Expression';
      default:
        return '';
    }
  }

  interactionMetadata(mediatorIds,pubmedIds){
    let metadata = [['List',[]],['Detailed Views',[]]];//Format expected by format-content
    mediatorIds.split(';').forEach( link => {
      const id=link.split('/')[4];
      metadata[1][1].push(link.includes('reactome') ? ['Reactome',id]:['Pathway Commons',id]);
    });
    if(pubmedIds){
     pubmedIds.split(';').forEach(id=>metadata[0][1].push(['PubMed',id]));
    }
   return metadata;
}

  addInteraction(nodes,edge,sources,network,nodeMap,nodeMetadata){
    const interaction= this.edgeType(edge);
    nodes.forEach((node)=>{
      if(!nodeMap.has(node)){
        const metadata=nodeMetadata.get(node);
        nodeMap.set(node,true);
        const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');
        network.nodes.push({data:{class: "ball",id: node,label: node, queried: this.state.ids.indexOf(node)!=-1 ,
        parsedMetadata:[['Type','bp:'+metadata[0].split(' ')[0].replace(/Reference/g,'').replace(/;/g,',')],['Database IDs', links]]}});
      }
    });

    network.edges.push({data: {
      id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
      label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
      source: nodes[0],
      target: nodes[1],
      class: interaction,
      parsedMetadata:sources
    },classes:interaction});
  }

  parse(data){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    if(data){
      const dataSplit=data.split('\n\n');
      const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
      dataSplit[0].split('\n').slice(1).forEach(line => {
        const splitLine=line.split('\t');
        const edgeMetadata = this.interactionMetadata(splitLine[6],splitLine[4]);
        this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],edgeMetadata,network,nodeMap,nodeMetadata);
      });
      return network;
    }
    else{
      return {};
    }
  }
  filterUpdate(type) {
    const state=this.state;
    const categories = state.categories;
    const filters=state.filters;
    const cy= state.cy;
    const edges=categories.get(type).edges;
    const nodes=categories.get(type).nodes;

    hideTooltips(cy);
    const hovered = cy.filter(ele=>ele.scratch('_hover-style-before'));
    cy.batch(()=>{
      removeStyle(cy, hovered, '_hover-style-before');
      if(filters[type]){
          cy.remove(edges);
          cy.remove(nodes.filter(nodes=>nodes.connectedEdges().empty()));
      }
      else{
        edges.union(nodes).restore();
      }
    });

    filters[type]=!filters[type];
    this.setState({
      filters:filters
    });
  }
  render(){
    const state = this.state;
    const loaded = state.loaded.network && state.loaded.ids;
    const baseView = !_.isEmpty(state.networkJSON) ? h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      //interaction specific
      activeMenu:filterMenuId,
      filterUpdate:(evt,type)=> this.filterUpdate(evt,type),
      filters: state.filters,
      download: {
        types: downloadTypes.filter(ele=>ele.type==='png'||ele.type==='sif'),
        promise: () => Promise.resolve(_.map(state.cy.edges(),edge=> edge.data().id).sort().join('\n'))
      },
    }):
    h('div.no-network',[h('strong.title','No interactions to display'),h('span','Try a diffrent set of entities')]);

    const loadingView = h(Loader, { loaded: loaded, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = loaded ? baseView : loadingView;
    return h('div.main', [content]);
  }
}
module.exports = Interactions;