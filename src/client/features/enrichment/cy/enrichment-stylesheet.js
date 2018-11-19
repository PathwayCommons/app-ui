const cytoscape = require('cytoscape');


function getNodeSize( geneCount ){
  return mapGeneCountToSize(Math.min( geneCount, 200 ));
}

function mapGeneCountToSize( geneCount ){
  return geneCount;
}

const enrichmentStylesheet=cytoscape.stylesheet()
.selector('edge')
  .css({
    'opacity': 0.3,
    'curve-style': 'haystack',
    'haystack-radius': 0.25,
    'line-color': '#555',
    'width': 4
  })
.selector('node')
  .css({
    'font-size': 20,
    'color': '#fff',
    'background-color': '#555',
    'text-outline-color': '#555',
    'text-outline-width': 4,
    'text-wrap': 'wrap',
    'text-max-width': 175,
    'width': node => node.data('geneCount') ? getNodeSize(node.data('geneCount')) : 50,
    'height': node => node.data('geneCount') ? getNodeSize(node.data('geneCount')) : 50,
    'label': node => node.data('description'),
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
.selector('node:selected')
  .css({
    'background-color': '#0169d9',
    'text-outline-color': '#0169d9'
  })
.selector('.hidden')
  .css({
    'display':'none',
  })
.selector('.highlighted')
  .css({
    'opacity':1,
  })
.selector('.unhighlighted')
  .css({
    'opacity':0.4,
  })
.selector(`.matched`)
  .css({
    'background-color': 'yellow',
    'text-outline-color': 'yellow'
  });
module.exports = enrichmentStylesheet;
