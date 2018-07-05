const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

const hideTooltips = require('../../common/cy/events/click').hideTooltips;
const removeStyle= require('../../common/cy/manage-style').removeStyle;
const CytoscapeService = require('../../common/cy/');
const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const { ServerAPI } = require('../../services/');
const FilterMenu= require('./filter-menu');
const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const downloadTypes = require('../../common/config').downloadTypes;

const filterMenuId='filter-menu';
const toolbarButtons = _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'},{'id':'showInfo'}],'id');
const interactionsConfig={
  toolbarButtons: toolbarButtons.concat({
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

    const query = queryString.parse(props.location.search);
    const sources = _.uniq(_.concat([],query.source)); //IDs or URIs

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet, showTooltipsOnEdges:true, minZoom:0.01 }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name : sources+' Interactions',
        datasource : 'Pathway Commons',
        comments: []
      },
      ids: sources,
      loaded: false,
      categories: new Map (),
      filters:{
        Binding:true,
        Phosphorylation:true,
        Expression:true
      }
    };

    ServerAPI.getInteractionGraph({sources:sources})
      .then(result=>{
        const layoutConfig = getLayoutConfig('interactions');
        const network= result.network;
        this.setState({
          componentConfig : interactionsConfig,
          layoutConfig : layoutConfig,
          networkJSON : network,
          loaded: true
        });
    });

    this.state.cySrv.loadPromise().then(cy => {
      const state = this.state;
      const categories = state.categories;
      const filters=state.filters;
      _.forEach(filters,(value,type)=>{
        const edges = cy.edges().filter(`.${type}`);
        const nodes = edges.connectedNodes();

        if (edges.length) {
          categories.set(type,{edges:edges,nodes:nodes});
        } else {
          categories.delete(type);
          delete filters[type];
        }
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
    const loaded = state.loaded;
    const baseView = !_.isEmpty(state.networkJSON) ? h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cySrv: state.cySrv,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      //interaction specific
      activeMenu:filterMenuId,
      filterUpdate:(evt,type)=> this.filterUpdate(evt,type),
      filters: state.filters,
      download: {
        types: downloadTypes.filter(ele=>ele.type==='png'||ele.type==='sif'),
        promise: () => Promise.resolve(_.map(state.cySrv.get().edges(),edge=> edge.data().id).sort().join('\n'))
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