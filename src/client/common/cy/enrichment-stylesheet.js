const cytoscape = require('cytoscape');

var p_valueColorScale = [
  { p_value: 0.0, color: { r: 153, g: 255, b: 102 } },
  { p_value: 0.0125, color: { r: 0, g: 184, b: 230 } },
  { p_value: .025, color: { r: 115, g: 0, b: 230 } },
  { p_value: .0375, color: { r: 255, g: 0, b: 102 } },
  { p_value: .05, color: { r: 255, g: 255, b: 153 } },

 ];

var getColorForP_Value = function(p_value) {
  let i = 0;

  switch(true) {
    case (p_value <= .0125):
      i = 1;
      break;
    case (p_value <= .025):
      i = 2;
      break;
    case (p_value <= .0375):
      i = 3;
      break;
    case (p_value <= .05):
      i = 4;
      break;
    default:
      return '#555';
  }


  // if(p_value > 0.05) return '#555'; //should never happen

  // //iterate through to find upperColor and lowerColor color bound
  // for (var i = 1; i < p_valueColorScale.length - 1; i++) {
  //     if (p_value < p_valueColorScale[i].p_value) {
  //         break;
  //     }
  // }

  // while(p_value > p_valueColorScale[i].p_value) i++;

  var lowerColor = p_valueColorScale[i - 1];
  var upperColor = p_valueColorScale[i];
  var colorRange = upperColor.p_value - lowerColor.p_value;

  //create a linear scale with upper and lower colors
  var rangePct = (p_value - lowerColor.p_value) / colorRange;
  var pctLower = 1 - rangePct;
  var pctUpper = rangePct;
  var color = {
      r: Math.floor(lowerColor.color.r * pctLower + upperColor.color.r * pctUpper),
      g: Math.floor(lowerColor.color.g * pctLower + upperColor.color.g * pctUpper),
      b: Math.floor(lowerColor.color.b * pctLower + upperColor.color.b * pctUpper)
  };
  return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
};


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
  'background-color': node => getColorForP_Value(node.data('p_value')),
  'background-opacity':0.8,
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'width': node => node.data('size') ? node.data('size') : 30,
  'height': node => node.data('size') ? node.data('size') : 30,
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