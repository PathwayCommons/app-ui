const cytoscape = require('cytoscape');

//Layouts
const cola = require('cytoscape-cola');
const klay = require('cytoscape-klay');
const klayjs = require('klayjs');
const coseBilkent = require('cytoscape-cose-bilkent');
const dagre = require('cytoscape-dagre');

const compoundCollapse = require('cytoscape-compound-collapse');
const fisheye = require('cytoscape-fisheye');

//Tooltips
// const tippy = require('cytoscape-tippy');


module.exports = () => {
  cytoscape.use(cola);
  cytoscape.use(klay, klayjs);
  cytoscape.use(coseBilkent);
  cytoscape.use(dagre);
  cytoscape.use(compoundCollapse);
  cytoscape.use(fisheye);
  // cytoscape.use(tippy);
};