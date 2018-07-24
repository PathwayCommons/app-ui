const cytoscape = require('cytoscape');

//match 'p_valueColorScale' with .enrichment-legend-stat-significant background
const p_valueColorScale = [
  { p_value: 0, color: { r: 0, g: 128, b: 0 } }, //html green
  { p_value: .05, color: { r: 230, g: 255, b: 230 } }
 ];

function getNodeColor( p_value ){

  if( p_value > 0.05 ) return '#555';

  //NOTE: if > 2 colors in scale, iterate through p_valueColorScale.p_value to find upper and lower color bounds
  const lowerColor = p_valueColorScale[0];
  const upperColor = p_valueColorScale[1];
  const colorRange = upperColor.p_value - lowerColor.p_value;

  //create a linear scale with upper and lower colors
  const rangePct = (p_value - lowerColor.p_value) / colorRange;
  const pctLower = 1 - rangePct;
  const pctUpper = rangePct;
  const color = {
      r: Math.floor(lowerColor.color.r * pctLower + upperColor.color.r * pctUpper),
      g: Math.floor(lowerColor.color.g * pctLower + upperColor.color.g * pctUpper),
      b: Math.floor(lowerColor.color.b * pctLower + upperColor.color.b * pctUpper)
  };
  return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
}

function getNodeSize( geneCount ){
  return mapGeneCountToSize(Math.min( geneCount, 200 ));
}

function mapGeneCountToSize( geneCount ){
  return ( 1*(geneCount - 5) + 30 );
}

const enrichmentStylesheet=cytoscape.stylesheet()
.selector('edge')
.css({
  'opacity': 0.3,
  'arrow-scale': 1.75,
  'curve-style': 'bezier',
  'line-color': '#555',
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
  'background-color': node => getNodeColor(node.data('p_value')),
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
})
.selector('.highlighted')
.css({
  'opacity':1,
})
.selector('.unhighlighted')
.css({
  'opacity':0.4,
});
module.exports = enrichmentStylesheet;
