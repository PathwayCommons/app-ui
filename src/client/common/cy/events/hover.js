const _ = require('lodash');

const {applyStyle, removeStyle} = require('../manage-style');

//style for nodes which are highligted on hover
const baseHoverStyle = {
  'opacity': 1,
  'background-color':'green'
};
//style for all nodes which are NOT highlighted on hover
const baseNotHoverStyle = {
  'opacity':1,
  'background-color':'blue'
};


const bindHover = (cy) => {

  /**
   * @description Apply style modifications after 200ms delay on `mouseover` for non-compartment nodes.
   * Currently highlights hovered node & its neighbourhood in green.
   */
  cy.on('mouseover', 'node[class!="compartment"]',_.debounce(evt => {

    console.log("node mouseover");

    const node = evt.target;

    //If node has children and is expanded, do not highlight
    if (node.isParent() && node.isExpanded()) { return; }

    //Apply 'no hover' style to all nodes & edges
    //applyStyle(cy,cy.nodes(),baseNotHoverStyle,'_unhighlighted');
    //applyStyle(cy,cy.edges(),baseNotHoverStyle,'_unhighlighted');

    //Highlight the hovered node & it's neighbourhood
    node.neighborhood().nodes().union(node).forEach(node => {
      applyStyle(cy, node, baseHoverStyle, '_highlighted');
    });

    //highlight all edges connecting nodes in the neighbourhood
    applyStyle(cy, node.neighborhood().edges(), baseHoverStyle, '_highlighted');


  },200,{leading:false,trailing:true}));

  /**
   * @description Remove any style modifications made from a non-compartment node hover on `mouseout`
   */
  cy.on('mouseout', 'node[class!="compartment"]', evt => {

    console.log("node mouseout");

    const node = evt.target;
    const neighborhood = node.neighborhood();

    //Remove 'no hover' style from all nodes & edges
    //removeStyle(cy,cy.nodes(),'_unhighlighted');
    //removeStyle(cy,cy.edges(),'_unhighlighted');
    
    removeStyle(cy, neighborhood.nodes(), '_highlighted');
    removeStyle(cy, node, '_highlighted');
    removeStyle(cy, neighborhood.edges(), '_highlighted');
  });

  /**
   * @description Apply style modifications after 200ms delay on `mouseover` for edges.
   * Currently highlights hovered edge & its neighbourhood in green.
   */
  cy.on('mouseover', 'edge',_.debounce(evt => {
    const edge = evt.target;

    //Apply 'no hover' style to all nodes & edges
    //applyStyle(cy,cy.nodes(),baseNotHoverStyle,'_unhighlighted');
    //applyStyle(cy,cy.edges(),baseNotHoverStyle,'_unhighlighted');
    
    //Highlight the hovered edge
    applyStyle(cy, edge, baseHoverStyle, '_highlighted');
    //Highlight the nodes connected to the hovered edge
    edge.source().union(edge.target()).forEach((node) => {
      applyStyle(cy, node, baseHoverStyle, '_highlighted');
    });

  },200,{leading:false,trailing:true}));

  /**
   * @description Remove any style modifications made from an edge hover on `mouseout`
   */
  cy.on('mouseout', 'edge', evt => {
    const edge = evt.target;

    //Remove 'no hover' style from all nodes & edges
    //removeStyle(cy,cy.nodes(),'_unhighlighted');
    //removeStyle(cy,cy.edges(),'_unhighlighted');
    
    //De-Highlight the hovered edge
    removeStyle(cy, edge, '_highlighted');
    //De-Highlight the nodes connected to the hovered edge
    edge.source().union(edge.target()).forEach((node) => {
      removeStyle(cy, node, '_highlighted');
    });
  });
};

module.exports = bindHover;