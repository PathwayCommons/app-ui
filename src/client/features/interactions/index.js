const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

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
    };    
    const query = queryString.parse(props.location.search);
    ServerAPI.getNeighborhood(query.ID).then(res=>{ 
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
    for (let i of data){
      if (i[1][2].includes(id)||i[1][3].includes(id)){
        return i[0]; 
      }
    }
  }

  pathwayLinks(sources){
    return sources.split(';').map( link => {
      const splitLink=link.split('/').reverse();
      return [splitLink[1]==='reactome'? 'reactome': 'Pathway Commons',splitLink[0]];
    });
  }

  addInteraction(nodes,edge,sources,network,nodeMap,nodeMetadata){
    for (let i = 0; i<2; i++){
      if(!nodeMap.has(nodes[i])){
        const metadata=nodeMetadata.get(nodes[i]);
        nodeMap.set(nodes[i],true);
        const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>[entry.split(':')[0],entry.split(':')[1]]))),_.isEqual);       
        network.nodes.push({data:{class: "ball",id: nodes[i],label: nodes[i],parsedMetadata:[
          ['Type','bp:'+metadata[0].split(' ')[0]],['Database IDs', links]]}});
      }
    }

    network.edges.push({data: {
      id: nodes[0]+edge+nodes[1] ,
      label:nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
      source:nodes[0],
      target: nodes[1],
      class: this.edgeType(edge),
      parsedMetadata:[['Database IDs',sources]]
    },classes:this.edgeType(edge)});
  }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    const dataSplit=data.split('\n\n');
    const interactions=dataSplit[0].split('\n').slice(1).map(line => line.split('\t'));
    const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
    const id=this.findId(nodeMetadata,query);
  
    for(let i = 0; interactions[i]; i++){
      let splitLine=interactions[i];
      this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],this.pathwayLinks(splitLine[6]),network,nodeMap,nodeMetadata);
   }
    return {id,network};
  }

  render(){
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      id:state.id,
      interactionView: true
    });
    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;