const apiCaller = require('../../../../services/apiCaller/');

/**
 *
 * @param cy A cytoscape graph object 
 * @returns nothing
 * @desc Gets a sharable link and saves the link to the clipboard. 
 */
function getShareLink(cy, uri) {
  //Get graph information
  const nodes = cy.nodes();
  const pan = cy.pan();
  const zoom = cy.zoom();

  //Get base url
  let baseUrl = window.location.href;
  baseUrl = baseUrl.split("?")[0];
  baseUrl = baseUrl + '?uri=' + encodeURIComponent(uri) + '&snapshot='; 

  //Produce a positions object
  let positions = {};
  nodes.forEach(element => {
    let id = element.id();
    let position = element.position();
    positions[id] = position;
  });

  //Produce snapshot package
  const snapshot = {
    positions,
    pan,
    zoom
  };
  
  //Send package and return sharable link
  return apiCaller.addSnapshot(snapshot).then(res => baseUrl + res);
}


module.exports = getShareLink;
