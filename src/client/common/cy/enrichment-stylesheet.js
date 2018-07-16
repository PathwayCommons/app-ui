const cytoscape = require('cytoscape');

function getNodeSize( geneCount ){
  let size = ( geneCount <= 1000 ) ? mapGeneCountToSize(geneCount) : mapGeneCountToSize(1000);
  return size;
}

function mapGeneCountToSize( geneCount ){
  return ( (5 * Math.sqrt( geneCount -1 )) + 30 );
}

const enrichmentStylesheet=cytoscape.stylesheet()
.selector('edge')
.css({
  'opacity': 0.3,
  'arrow-scale': 1.75,
  'curve-style': 'bezier',
  'line-color': 'blue',
  'target-arrow-fill': 'hollow',
  'source-arrow-fill': 'hollow',
  'width':  edge => edge.data('similarity') ? edge.data('similarity') * 2 : 1.5,
  'target-arrow-color': '#555',
  'source-arrow-color': '#555',
  'text-border-color': '#555',
  'color': '#555'
})
.selector('node')
.css({
  'font-size': 20,
  'color': 'black',
  'background-color': '#00bfff', //TODO: Colored accoriding to p-value
  'background-opacity':0.8,
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'width': node => node.data('geneCount') ? getNodeSize(node.data('geneCount')) : 30,
  'height': node => node.data('geneCount') ? getNodeSize(node.data('geneCount')) : 30,
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
});
module.exports = enrichmentStylesheet;