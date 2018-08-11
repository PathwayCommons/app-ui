const cytoscape = require('cytoscape');
const iStylesheet=cytoscape.stylesheet()
.selector('edge')
  .css({
    'opacity': 0.3,
    'arrow-scale': 1.75,
    'line-color': '#555',
    'target-arrow-fill': 'hollow',
    'source-arrow-fill': 'hollow',
    'width': 1.5,
    'target-arrow-color': '#555',
    'source-arrow-color': '#555',
    'text-border-color': '#555',
    'color': '#555',
    'curve-style': 'haystack',
    'haystack-radius': 0.25
  })
.selector('edge[class@="Phosphorylation"]')
  .css({
    'line-color': 'red'
  })
.selector('edge[class@="Binding"]')
  .css({
    'line-color': 'green'
  })
.selector('edge[class@="Expression"]')
  .css({
    'line-color': 'blue'
  })
.selector('node[class@="ball"]')
  .css({
    'font-size': 20,
    'color': 'black',
    'background-color': 'grey',
    'background-opacity':0.8,
    'text-outline-color': 'white',
    'text-outline-width': 2,
    'text-wrap': 'wrap',
    'text-max-width': 175,
    'width': 30,
    'height': 30,
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
  'opacity':0.2,
})
.selector('.metric-hidden')
.css({
  'display':'none',
})
.selector('.type-hidden')
.css({
  'display': 'none'
})
.selector(`.matched`)
.css({
  'overlay-color': 'yellow',
  'overlay-padding': 0,
  'overlay-opacity': 0.5
});
module.exports = iStylesheet;