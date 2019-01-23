const cytoscape = require('cytoscape');

const DEFAULT_NODE_SIZE = 30;

let  getNodeSize = node => {
  let geneCount = node.data('geneCount') || DEFAULT_NODE_SIZE;

  return Math.min( Math.max(DEFAULT_NODE_SIZE, geneCount), 100 );
};

const enrichmentStylesheet=cytoscape.stylesheet()
.selector('edge')
  .css({
    'opacity': 0.3,
    'curve-style': 'haystack',
    'haystack-radius': 0,
    'line-color': '#555',
    'width': edge => {
      let similarity = edge.data('similarity');

      if( similarity <= 0.3 ){
        return 2;
      }

      if( similarity <= 0.75 ){
        return 4;
      }

      return 12;
    }
  })
.selector('node')
  .css({
    'font-size': 14,
    'color': '#fff',
    'background-color': '#333',
    'text-outline-color': '#333',
    'text-outline-width': 4,
    'text-wrap': 'wrap',
    'text-max-width': 175,
    'width': node => getNodeSize(node),
    'height': node => getNodeSize(node),
    'label': node => node.data('name'),
    'min-zoomed-font-size': 5,
    'text-halign': 'center',
    'text-valign': 'center',
    'text-events': 'yes'
  })
.selector('$node > node')
  .css({
    'text-outline-width': 0,
    'label': node => node.data('tags') != '' ? `Tags: ${node.data('tags')}` : '',
    'border-width': 5,
    'background-color': 'white',
    'color': '#333',
    'text-valign': 'bottom',
    'text-max-width': 1000,
    'font-size': 40,
    'text-events': 'no'
  })
.selector('node[?queried]')
  .css({
    'background-color': 'blue',
    'opacity': 1,
    'z-compound-depth': 'top',
    'color': 'white',
    'text-outline-color': 'black'
  })
.selector('node:selected')
  .css({
    'background-color': '#0169d9',
    'text-outline-color': '#0169d9'
  })
.selector('edge:selected')
  .css({
    'z-index': 999,
    'opacity': 1,
    'line-color': '#0169d9'
  })
.selector('.hidden')
  .css({
    'display':'none',
  })
.selector('.highlighted')
  .css({
    'opacity': 1,
  })
.selector('.unhighlighted')
  .css({
    'opacity': 0.1,
  })
.selector(`.matched`)
  .css({
    'border-color': 'yellow',
    'border-width': 10,
    'background-color': '#606000',
    'text-outline-color': '#606000'
  });
module.exports = enrichmentStylesheet;
