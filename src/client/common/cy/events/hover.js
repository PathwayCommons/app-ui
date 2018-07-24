const _ = require('lodash');

const bindHover = (cy) => {

  /**
   * @description Apply style modifications after 200ms delay on `mouseover` for non-compartment nodes.
   * Currently puts opacity of hovered node & neighbourhood to 1, everything else to 0.3
   */
  const nodeHoverMouseOver = _.debounce(evt => {
    const node = evt.target;
    const ecAPI = cy.expandCollapse('get');
    let elesToHighlight = cy.collection();

    //If node has children and is expanded, do not highlight
    if (node.isParent() && ecAPI.isCollapsible(node)) { return; }

    //Create a list of the hovered node & its neighbourhood
    node.neighborhood().nodes().union(node).forEach(node => {
      elesToHighlight.merge(node.ancestors());
      elesToHighlight.merge(node.descendants());
      elesToHighlight.merge(node);
    });
    elesToHighlight.merge(node.neighborhood().edges());

    //Add highlighted class to node & its neighbourhood, unhighlighted to everything else
    cy.elements().addClass('unhighlighted');
    elesToHighlight.forEach(ele => {
      ele.removeClass('unhighlighted');
      ele.addClass('highlighted');
    });

  },200,{leading:false,trailing:true});

  //call style-applying and style-removing functions on 'mouseover' and 'mouseout' for non-compartment nodes
  cy.on('mouseover', 'node[class!="compartment"]',nodeHoverMouseOver);
  cy.on('mouseout', 'node[class!="compartment"]', () => {
    nodeHoverMouseOver.cancel();
    cy.elements().removeClass('highlighted unhighlighted');
  });

};
module.exports = bindHover;