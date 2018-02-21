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
        networkJSON: network ,
        networkMetadata: {
          name: query.ID,
          datasource: 'Pathway Commons',
          comments: ['place holder'], dataSource: ['place holder'], organism: ['place holder'], title: ['place holder'], uri: 'place holder'
        },
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
    return data.filter(line => line.includes(id))[0].split('	')[0];
  }

  pathwayLinks(sources){
    return sources.split(';').map( link => {
      const splitLink=link.split('/').reverse();
      return [splitLink[1]==='reactome'? 'reactome': 'Pathway Commons',splitLink[0]];
    });
  }

  addInteraction(nodes,edge,sources,network,nodeMap){
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
      class: this.edgeType(edge),
      parsedMetadata:[['Database IDs',sources]]
    }});
  }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    const splitByLines=data.split('\n');
    const id=this.findId(splitByLines,query);
  
    for(let j = 0; j<2; j++){
      let i=1;
      while (splitByLines[i]){ 
        let splitLine=splitByLines[i].split('\t');
        if((j===0 && (splitLine[0]===id || splitLine[2]===id))||(j===1 && (nodeMap.has(splitLine[0]) && nodeMap.has(splitLine[2])))){ //if(a interaction with the main node(first loop))||
          this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],this.pathwayLinks(splitLine[6]),network,nodeMap);              //(2 nodes conected to the main node(second loop))
        }
        i++;
      }
      nodeMap.delete(id); //remove main node to prevent getting duplicates 
    }
    return network;
  }

  render(){
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata
    });
    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;