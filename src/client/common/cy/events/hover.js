const _ = require('lodash');

const {applyStyle, removeStyle} = require('../manage-style');



const hoverStyle = {
  //'background-color': 'green',
  'opacity': 1,
};

const notHoverStyle = {
  //'background-color':'blue',
  'opacity':0.4
};


const bindHover = (cy) => {

  /**
   * @description Apply style modifications after 200ms delay on `mouseover` for non-compartment nodes.
   * Currently highlights hovered node & its neighbourhood in green.
   */
  const nodeHoverMouseOver = _.debounce(evt => {
    const node = evt.target;

    //If node has children and is expanded, do not highlight
    if (node.isParent() && node.isExpanded()) { return; }

    //Apply 'no hover' style to all nodes & edges
    applyStyle(cy,cy.nodes(),notHoverStyle,'_unhighlighted');
    applyStyle(cy,cy.edges(),notHoverStyle,'_unhighlighted');

    //Highlight the hovered node & it's neighbourhood
    node.neighborhood().nodes().union(node).forEach(node => {
      applyStyle(cy, node, hoverStyle, '_highlighted');
    });

    //highlight all edges connecting nodes in the neighbourhood
    applyStyle(cy, node.neighborhood().edges(), hoverStyle, '_highlighted');

  },200,{leading:false,trailing:true});

  /**
   * @description Remove any style modifications made from a non-compartment node hover on `mouseout`
   */
  const nodeHoverMouseOut = evt => {
    const node = evt.target;
    const neighborhood = node.neighborhood();

    //Cancel the mouseover function, so the node is not highlighted later
    nodeHoverMouseOver.cancel();
    
    //remove hover style modifications from highlighted nodes & edges
    removeStyle(cy, neighborhood.nodes(), '_highlighted');
    removeStyle(cy, node, '_highlighted');
    removeStyle(cy, neighborhood.edges(), '_highlighted');

    //Remove 'no hover' style from all nodes & edges
    removeStyle(cy,cy.nodes(),'_unhighlighted');
    removeStyle(cy,cy.edges(),'_unhighlighted');
  };

    /**
   * @description Apply style modifications after 200ms delay on `mouseover` for edges.
   * Currently highlights hovered edge & its neighbourhood in green.
   */
  const edgeHoverMouseOver = _.debounce(evt => {
    const edge = evt.target;

    //Apply 'no hover' style to all nodes & edges
    applyStyle(cy,cy.nodes(),notHoverStyle,'_unhighlighted');
    applyStyle(cy,cy.edges(),notHoverStyle,'_unhighlighted');
    
    //Highlight the hovered edge
    applyStyle(cy, edge, hoverStyle, '_highlighted');

    //Highlight the nodes connected to the hovered edge
    edge.source().union(edge.target()).forEach((node) => {
      applyStyle(cy, node, hoverStyle, '_highlighted');
    });

  },200,{leading:false,trailing:true});

  /**
   * @description Remove any style modifications made from an edge hover on `mouseout`
   */
  const edgeHoverMouseOut = evt => {
    const edge = evt.target;
    edgeHoverMouseOver.cancel();

    //remove hover style modifications from highlighted nodes & edges
    removeStyle(cy, edge, '_highlighted');
    removeStyle(cy, edge.source(), '_highlighted');
    removeStyle(cy, edge.target(), '_highlighted');

    //Remove 'no hover' style from all nodes & edges
    removeStyle(cy,cy.nodes(),'_unhighlighted');
    removeStyle(cy,cy.edges(),'_unhighlighted');
  };

  //Call the functions defined earlier on cyotscape js events
  cy.on('mouseover', 'node[class!="compartment"]',nodeHoverMouseOver);
  cy.on('mouseout', 'node[class!="compartment"]', nodeHoverMouseOut);
  cy.on('mouseover', 'edge',edgeHoverMouseOver);
  cy.on('mouseout', 'edge',edgeHoverMouseOut);

};

module.exports = bindHover;