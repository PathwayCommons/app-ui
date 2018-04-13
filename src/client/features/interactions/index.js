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
      loading: true,
      categories: new Map (),
      buttonsClicked:{
        Binding:false,
        Phosphorylation:false,
        Expression:false
      },
      numNodesToHave:1
    };    

    const query = queryString.parse(props.location.search);
    query.id=_.concat([],query.id);
    ServerAPI.getNeighborhood(query.id,query.kind).then(res=>{ 
      const layoutConfig = getLayoutConfig('interactions');
      const network= this.parse(res);
      this.setState({
        componentConfig: interactionsConfig,
        layoutConfig: layoutConfig,
        networkJSON: network ,
        loading: false
      });
    });

    ServerAPI.getGeneInformation(query.id,'gene').then(result=>{
      const geneResults=result.result;
      let hgncIds=[];
      const comments=_.flatten(geneResults.uids.map(gene=>{
        hgncIds.push(geneResults[gene].name);
        return _.compact([
          'Nomenclature Name: '+geneResults[gene].nomenclaturename,
          'Other Aliases: '+geneResults[gene].name + (geneResults[gene].otheraliases ? ', '+geneResults[gene].otheraliases:''),
          geneResults[gene].summary&&'Function: '+geneResults[gene].summary
        ]);
      }));
      this.setState({
        networkMetadata: {
          name: (hgncIds+' Interactions'),
          datasource: 'Pathway Commons',
          comments: comments
        },
        ids:hgncIds,
        mainNodeGroup:['temp']
      }); 
    });

    this.state.cy.on('trim', () => {
      const state = this.state;
      const ids = state.ids;
      const cy = state.cy;
      let mainNodeGroup= cy.nodes(),mainNode = cy.nodes();
      if(ids.length===query.id.length){
        mainNode = cy.nodes(node=> ids.indexOf(node.data().id) != -1);
        mainNodeGroup = mainNode.connectedEdges().connectedNodes();
        cy.remove(cy.nodes().difference(mainNodeGroup));
      }
    
      this.setState({
        mainNode:mainNode,
        mainNodeGroup:mainNodeGroup.sort((a,b)=> b.degree() - a.degree()),
        numNodesToHave: mainNodeGroup.length>40 ?_.round(mainNodeGroup.length/2) :mainNodeGroup.length
      });
    });

    this.state.cy.one('layoutstop',()=>{
      const state = this.state;
      const cy = this.state.cy;
      const categories = state.categories;
      const buttonsClicked=state.buttonsClicked;
      _.forEach(buttonsClicked,(value,type)=>{
        const edges = cy.edges().filter(`.${type}`);
        const nodes = edges.connectedNodes();
        edges.length?
        categories.set(type,{edges:edges,nodes:nodes}):
        (categories.delete(type),delete buttonsClicked[type]);      
      });
      _.tail(_.toPairs(buttonsClicked)).map(pair=>this.filterUpdate(pair[0]));
      this.sliderUpdate(state.numNodesToHave,state.mainNodeGroup.length);
      this.setState({
        categories:categories,
        buttonsClicked:buttonsClicked
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
    let metadata = [['Detailed views',[]],['Database IDs',[]]];//Format expected by format-content
    mediatorIds.split(';').forEach( link => {
        metadata[0][1].push(['Interaction',link.split('/')[4]]);
    });
    if(pubmedIds){
     pubmedIds.split(';').forEach(id=>metadata[1][1].push(['PubMed_Interactions',id]));
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
          cy.remove(nodes.filter(nodes=>nodes.connectedEdges(':visible').empty()));
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

  sliderUpdate(numNodesToHave,currentNumberOfNodes){
    console.log(arguments);
    if(!currentNumberOfNodes){currentNumberOfNodes=numNodesToHave.b;numNodesToHave=numNodesToHave.a;}
    const upperRange=Math.max(currentNumberOfNodes,numNodesToHave);
    const lowerRange = Math.min(currentNumberOfNodes,numNodesToHave);
    console.log({numNodesToHave:numNodesToHave, currentNumberOfNodes: currentNumberOfNodes});
    if(upperRange!=lowerRange){
      console.log({'full length':this.state.mainNodeGroup.length,lowerRangemin:lowerRange,upperRange:upperRange});
      const nodesToChange= this.state.mainNodeGroup.slice(lowerRange,upperRange);
      console.log(nodesToChange);
      numNodesToHave>currentNumberOfNodes ?  nodesToChange.style({display:'element'}) : nodesToChange.style({display:'none'});
    }
    this.setState({numNodesToHave: numNodesToHave});
  }

  render(){
    const state = this.state;
    const networkToDisplay = !_.isEmpty(state.networkJSON);
    // console.log(state.numNodesToHave);
    const baseView = networkToDisplay ? h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      //interaction specific
      activeMenu:filterMenuId,
      filterUpdate:(evt,type)=> this.filterUpdate(evt,type),
      sliderUpdate:(value)=> this.sliderUpdate(value),
      buttonsClicked: state.buttonsClicked,
      download: {
        types: downloadTypes.filter(ele=>ele.type==='png'||ele.type==='sif'), 
        promise: () => Promise.resolve(_.map(state.cy.edges(),edge=> edge.data().id).sort().join('\n'))
      },
      numNodesToHave:state.numNodesToHave,
      sliderMax: state.mainNodeGroup.length
    }):
    h('div.no-network',[h('strong.title','No interactions to display'),h('span','Return to the previous page and try a diffrent set of entities')]);

    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div.main', [content]);
  }
}
module.exports = Interactions;