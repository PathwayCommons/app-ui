const cytoscape = require('cytoscape');

const stylesheet = require('./stylesheet');
const bindEvents = require('./events');

// set the sbgn style sheet
// bind interaction events (mouse hovering, collapsing)
function make_cytoscape(opts, callback){
  const cy = cytoscape({
    container: opts.container,
    style: stylesheet,
    minZoom: 0.16,
    maxZoom: 4,
    headless: opts.headless,
    zoomingEnabled: true
  });

  bindEvents(cy, callback);
  
  return cy;
}

module.exports = make_cytoscape;