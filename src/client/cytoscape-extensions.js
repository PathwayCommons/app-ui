const cytoscape = require('cytoscape');

//Layouts
const coseBilkent = require('cytoscape-cose-bilkent');
const klay = require('cytoscape-klay');
const klayjs = require('klayjs');
const dagre = require('cytoscape-dagre');

const expandCollapse = require('cytoscape-expand-collapse');

//Tooltips
const popper = require('cytoscape-popper');

module.exports = () => {
  cytoscape.use(coseBilkent);
  cytoscape.use(klay, klayjs);
  cytoscape.use(dagre);
  cytoscape.use(expandCollapse);
  cytoscape.use(popper);
};