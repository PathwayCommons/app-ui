const cytoscape = require('cytoscape');
const iStylesheet=cytoscape.stylesheet()
.selector('edge')
  .css({
    'opacity': 0.4,
    'line-color': '#555',
    'width': 4,
    'curve-style': 'haystack',
    'haystack-radius': 0.25
  })
.selector('edge[class@="Phosphorylation"]')
  .css({
    'line-color': '#ffc28b'
  })
.selector('edge[class@="Binding"]')
  .css({
    'line-color': '#8bd8dd'
  })
.selector('edge[class@="Expression"]')
  .css({
    'line-color': '#f4a2a3'
  })
.selector('node[class@="ball"]')
  .css({
    'font-size': 20,
    'color': '#fff',
    'background-color': '#555',
    'text-outline-color': '#555',
    'text-outline-width': 4,
    'width': 50,
    'height': 50,
    'label': 'data(label)',
    'text-halign': 'center',
    'text-valign': 'center',
  })
.selector('node[?queried]')
  .css({
    'width': 75,
    'height': 75
  })
.selector('.highlighted')
  .css({
    'opacity':1,
  })
.selector('.unhighlighted')
  .css({
    'opacity':0.2,
  })
.selector('.metric-hidden')
  .css({
    'display':'none',
  })
.selector('.type-hidden')
  .css({
    'display': 'none'
  });
module.exports = iStylesheet;