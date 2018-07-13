const cytoscape = require('cytoscape');

const iStylesheet=cytoscape.stylesheet()
.selector('edge')
.css({
  'opacity': 0.3,
  'arrow-scale': 1.75,
  'curve-style': 'bezier',
  'line-color': '#555',
  'target-arrow-fill': 'hollow',
  'source-arrow-fill': 'hollow',
  'width':  node => node.data('similarity') * 2,
  'target-arrow-color': '#555',
  'source-arrow-color': '#555',
  'text-border-color': '#555',
  'color': '#555'
})
.selector('node[class="ball"]')
.css({
  'font-size': 20,
  'color': 'black',
  'background-color': 'grey', //TODO: Colored accoriding to p-value
  'background-opacity':0.8,
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'width': node => node.data('size') ? node.data('size') : 30,
  'height': node => node.data('size') ? node.data('size') : 30,
  'label': node => node.data('label'),
  'text-halign': 'center',
  'text-valign': 'center',
})
.selector('node[?queried]')
.css({
  'background-color': 'blue',
  'opacity': 1,
  'z-compound-depth': 'top',
  'color': 'white',
  'text-outline-color': 'black'
})
.selector('.highlighted')
.css({
  'opacity':1,
})
.selector('.unhighlighted')
.css({
  'opacity':0.4,
});
module.exports = iStylesheet; 