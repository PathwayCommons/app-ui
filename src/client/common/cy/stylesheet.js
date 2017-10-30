const cytoscape = require('cytoscape');
const sbgnStyleSheet = require('cytoscape-sbgn-stylesheet');

const stylesheet = sbgnStyleSheet(cytoscape)
.selector('node[class!="compartment"]')
.css({
  'font-size': 20,
  'color': 'black',
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-outline-opacity': 0.5,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'label': node => {
    const label = node.data('label')
      .split('(').join('').split(')').join('')
      .split(':').join(' ');
    return label;
  }
})
.selector('node[class="complex"]')
.css({
  'width': 45,
  'height': 45
})
.selector('.compoundcollapse-collapsed-node')
.css({
  'font-size': 20,
  'background-color': 'rgb(44,62,80)',
  'color': 'white',
  'text-outline-color': 'black',
  'text-outline-width': 2,
  'text-outline-opacity': 1,
  'text-valign': 'center',
  'opacity': 1,
  'text-wrap': 'wrap',
  'text-max-width': 175
})
.selector('edge')
.css({
  'opacity': 0.3
});

module.exports = stylesheet;