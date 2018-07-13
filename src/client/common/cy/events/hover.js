const _ = require('lodash');

/**
 * @description Adds a node and all its children to an array
 * @param {*} cy Cytoscape network object
 * @param {*} node Starting node for list
 */
const addChildrenToList = (node,elesList) => {
  elesList.add(node);
  let children = node.children();
  if(!children)
    return;
  children.forEach(child => {
    elesList.add(child);
    addChildrenToList(child,elesList);
  });
};

/**
 * @description Applies a style to all the parents of a node
 * @param {*} cy Cytoscape Network Object
 * @param {*} node Node which style is to be applied
 */
const addParentsToList = (node,elesList) => {
  let parent = node.parent();
  if(parent.length === 0)
    return;
    elesList.add(parent);
  addParentsToList(parent,elesList);
};

const bindHover = (cy) => {

  /**
   * @description Apply style modifications after 200ms delay on `mouseover` for non-compartment nodes.
   * Currently highlights hovered node & its neighbourhood in green.
   */
  const nodeHoverMouseOver = _.debounce(evt => {
    const node = evt.target;
    const ecAPI = cy.expandCollapse('get');
    let elesToHighlight = new Set();

    //If node has children and is expanded, do not highlight
    if (node.isParent() && ecAPI.isCollapsible(node)) { return; }

    //Create a list of the hovered node & its neighbourhood
    node.neighborhood().nodes().union(node).forEach(node => {
      addChildrenToList(node,elesToHighlight);
      addParentsToList(node,elesToHighlight);
    });
    node.neighborhood().edges().forEach(edge => elesToHighlight.add(edge));

    //Add highlighted class to node & its neighbourhood, unhighlighted to everything else
    cy.elements().addClass('unhighlighted');
    elesToHighlight.forEach(ele => {
      ele.removeClass('unhighlighted');
      ele.addClass('highlighted');
    });

  },200,{leading:false,trailing:true});

    /**
   * @description Apply style modifications after 200ms delay on `mouseover` for edges.
   * Currently highlights hovered edge & its neighbourhood in green.
   */
  const edgeHoverMouseOver = _.debounce(evt => {
    const edge = evt.target;
    let elesToHighlight = new Set();
    
    //Create a list of the hovered edge & its neighbourhood
    elesToHighlight.add(edge);
    edge.source().union(edge.target()).forEach((node) => {
      addChildrenToList(node,elesToHighlight);
      addParentsToList(node,elesToHighlight);
    });

    //Add highlighted class to edge & its neighbourhood, unhighlighted to everything else
    cy.elements().addClass('unhighlighted');
    elesToHighlight.forEach(ele => {
      ele.removeClass('unhighlighted');
      ele.addClass('highlighted');
    });

  },200,{leading:false,trailing:true});

  //apply & remove styling on mouseover and mouseout cytoscape js events for nodes
  cy.on('mouseover', 'node[class!="compartment"]',nodeHoverMouseOver);
  cy.on('mouseout', 'node[class!="compartment"]', () => {
    nodeHoverMouseOver.cancel();
    cy.elements().removeClass('highlighted unhighlighted');
  });

  //apply & remove styling on mouseover and mouseout cytoscape js events for nodes
  cy.on('mouseover', 'edge',edgeHoverMouseOver);
  cy.on('mouseout', 'edge', () => {
    edgeHoverMouseOver.cancel();
    cy.elements().removeClass('highlighted unhighlighted');
  });

};
module.exports = bindHover;