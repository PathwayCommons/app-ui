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

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');

class Interactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true, stylesheet: interactionsStylesheet }),
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
      catagories: new Map (),
        buttons:new Map([['Binding',false],
                        ['Phosphorylation',false],
                        ['Expression',false]
                      ]),
    };    
    const query = queryString.parse(props.location.search);
    ServerAPI.getNeighborhood(query.ID,'TXT').then(res=>{ 
      const layoutConfig = getLayoutConfig('interactions');
      const componentConfig = _.merge({}, BaseNetworkView.config, { useSearchBar: true});
      const network= this.parse(res,query.ID);
      this.setState({
        componentConfig: componentConfig,
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
      const mainNode=this.state.cy.nodes(node=> node.data().id===this.state.id);
      const nodesToKeep=mainNode.merge(mainNode.connectedEdges().connectedNodes());
      const catagories=this.state.catagories;
      this.state.cy.remove(this.state.cy.nodes().difference(nodesToKeep));
      
      [...this.state.buttons].forEach(([type, clicked])=>{
      const edges= this.state.cy.edges().filter(`.${type}`);
      const nodes = edges.connectedNodes();
      catagories.set(type,{
        edges:edges,
        nodes:nodes
      });
      if(type!='Binding'){
        this.filterUpdate(null,type);
      }
    });
    this.setState({
      catagories:catagories
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
    return data.filter(line => line.includes(id))[0].split('	')[0];
  }

  pathwayLinks(sources){
    return sources.split(';').map( link => {
      const splitLink=link.split('/').reverse();
      return [splitLink[1]==='reactome'? 'reactome': 'Pathway Commons',splitLink[0]];
    });
  }

  addInteraction(nodes,edge,sources,network,nodeMap){
    const interaction= this.edgeType(edge);
    for (let i = 0; i<2; i++){
      if(!nodeMap.has(nodes[i])){
        nodeMap.set(nodes[i],true);
        network.nodes.push({data:{class: "ball",id: nodes[i],label: nodes[i],parsedMetadata:[]}});
      }
    }
    network.edges.push({data: {
      id: nodes[0]+edge+nodes[1] ,
      label:nodes[0]+' '+edge+' '+nodes[1] ,
      source:nodes[0],
      target: nodes[1],
      class:interaction ,
      parsedMetadata:[['Database IDs',sources]]
    },classes:interaction});
  }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    const splitByLines=data.split('\n');
    const id=this.findId(splitByLines,query);
  
    for(let i = 0; splitByLines[i]; i++){
      let splitLine=splitByLines[i].split('\t');
      this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],this.pathwayLinks(splitLine[6]),network,nodeMap);
   }
    return {id,network};
  }
  filterUpdate(e,type) {
    const state=this.state;
    const catagories = state.catagories;
    const buttons=state.buttons;
    const cy= state.cy;
    const edges=catagories.get(type).edges;
    const nodes=catagories.get(type).nodes;

    hideTooltips(cy);
    const hovered = cy.filter(ele=>ele.style('background-color')==='blue'||ele.style('line-color')==='orange');
    removeStyle(cy, hovered, '_hover-style-before');

    if(!buttons.get(type)){
      cy.remove(edges);
      cy.remove(nodes.filter(nodes=>nodes.connectedEdges().length<=0));
    }
    else{ 
      edges.union(nodes).restore();
    }
    
    buttons.set(type,!buttons.get(type));
    this.setState({
      buttons:buttons
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
      activeMenu:'interactionsFilterMenu',
      filterUpdate:(evt,type)=> this.filterUpdate(evt,type),
      buttons: state.buttons,
    });
    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;