const cytoscape = require('cytoscape');
const sbgnStyleSheet = require('cytoscape-sbgn-stylesheet');
const { MATCHED_SEARCH_CLASS } = require('./actions');


module.exports = sbgnStyleSheet(cytoscape)
.selector('node')
.css({
  'background-opacity': '0.4'
})
.selector('node:active')
.css({
  'background-opacity': '0.7',
})
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
  'height': 45,
  'label': node => node.isParent() ? '' : node.data('label')
})
.selector('.cy-expand-collapse-collapsed-node')
.css({
  'font-size': 20,
  'text-max-width': 175
})
.selector('.cy-expand-collapse-meta-edge')
.css({
  'line-style': 'dashed'
})
.selector('edge')
.css({
  'opacity': 0.3
})
.selector('node[class="and"],node[class="or"],node[class="not"]')
.css({
  'label':node=>node.data('class')
})
.selector('.highlighted')
.css({
  'opacity':1,
})
.selector('.unhighlighted')
.css({
  'opacity':0.4,
})
.selector('.hidden')
.css({
  'display':'none',
})
.selector(`.${MATCHED_SEARCH_CLASS}`)
.css({
  'overlay-color': 'yellow',
  'overlay-padding': 0,
  'overlay-opacity': 0.5
});