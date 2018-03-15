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

const filterMenuId='filter-menu';
const interactionsConfig={
  toolbarButtons: BaseNetworkView.config.toolbarButtons.concat({
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
      cy: make_cytoscape({ headless: true, stylesheet: interactionsStylesheet, showTooltipsOnEdges:true }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      id:'',
      loading: true,
      categories: new Map (),
      buttonsClicked:{
        Binding:false,
        Phosphorylation:false,
        Expression:false
      }
    };    
    const query = queryString.parse(props.location.search);
    ServerAPI.getNeighborhood(query.ID,'TXT').then(res=>{ 
      const layoutConfig = getLayoutConfig('interactions');
      const network= this.parse(res,query.ID);
      this.setState({
        componentConfig: interactionsConfig,
        layoutConfig: layoutConfig,
        networkJSON: network.network ,
        networkMetadata: {
          name: query.ID,
          datasource: 'Pathway Commons',
          comments: ['place holder'], dataSource: ['place holder'], organism: ['place holder'], title: ['place holder'], uri: 'place holder'
        },
        id: network.id,
        loading: false
      }); 
      
    });
    this.state.cy.on('trim', () => {
      const categories=this.state.categories;
      const mainNode=this.state.cy.nodes(node=> node.data().id===this.state.id);
      const nodesToKeep=mainNode.merge(mainNode.connectedEdges().connectedNodes());
      this.state.cy.remove(this.state.cy.nodes().difference(nodesToKeep));
      _.forEach(this.state.buttonsClicked,(value,type)=>{
        const edges= this.state.cy.edges().filter(`.${type}`);
        const nodes = edges.connectedNodes();
        categories.set(type,{
          edges:edges,
          nodes:nodes
        });
        if(type!='Binding'){
          this.filterUpdate(type);
        }
      });
      this.setState({
        categories:categories
      });
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

  findId(data,id){
    let hgncId;
    data.forEach((value,key)=> {
      if (value[2].includes(id)){
        hgncId=key; 
      }
    });
    return hgncId;
  }

  pathwayLinks(sources){
    return sources.split(';').map( link => {
      const splitLink=link.split('/').reverse();
      return [splitLink[1]==='reactome'? 'reactome': 'Pathway Commons',splitLink[0]];
    });
  }

  addInteraction(nodes,edge,sources,network,nodeMap,nodeMetadata){
    const interaction= this.edgeType(edge);
   nodes.forEach((node)=>{
    if(!nodeMap.has(node)){
      const metadata=nodeMetadata.get(node);
      nodeMap.set(node,true);
      const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');       
      network.nodes.push({data:{class: "ball",id: node,label: node,parsedMetadata:[
        ['Type','bp:'+metadata[0].split(' ')[0].replace(/Reference/g,'').replace(/;/g,',')],['Database IDs', links]]}});
      }
    });
    network.edges.push({data: {
      id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
      label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
      source: nodes[0],
      target: nodes[1],
      class: interaction,
      parsedMetadata:[['Database IDs',sources]]
    },classes:interaction});
  }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    const dataSplit=data.split('\n\n');
    const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
    dataSplit[0].split('\n').slice(1).forEach(line => {
      const splitLine=line.split('\t');
      this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],this.pathwayLinks(splitLine[6]),network,nodeMap,nodeMetadata);
    });
    const id=this.findId(nodeMetadata,query);
    return {id,network};
  }
  filterUpdate(type) {
    const state=this.state;
    const categories = state.categories;
    const buttonsClicked=state.buttonsClicked;
    const cy= state.cy;
    const edges=categories.get(type).edges;
    const nodes=categories.get(type).nodes;

    hideTooltips(cy);
    const hovered = cy.filter(ele=>ele.scratch('_hover-style-before'));
    cy.batch(()=>{
      removeStyle(cy, hovered, '_hover-style-before');
      if(!buttonsClicked[type]){
          cy.remove(edges);
          cy.remove(nodes.filter(nodes=>nodes.connectedEdges().empty()));
      }
      else{ 
        edges.union(nodes).restore();
      }
    });
    
    buttonsClicked[type]=!buttonsClicked[type];
    this.setState({
      buttonsClicked:buttonsClicked
    });
  }
  render(){
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      //interaction specific
      activeMenu:filterMenuId,
      filterUpdate:(evt,type)=> this.filterUpdate(evt,type),
      buttonsClicked: state.buttonsClicked,
    });
    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;