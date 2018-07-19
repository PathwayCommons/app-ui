const cytoscape = require('cytoscape');
const sbgnStyleSheet = require('cytoscape-sbgn-stylesheet');
const _ = require('lodash');

const PathwayNodeMetadataTip = require('./pathway-node-metadata-tooltip');

const DEFAULT_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 5000,
  nodeDimensionsIncludeLabels: true,
  tilingPaddingVertical: 20,
  tilingPaddingHorizontal: 20,
  animate: true,
  animationDuration: 500,
  fit: true,
  padding: 75,
  randomize: false
};

const EXPAND_COLLAPSE_OPTS = {
  layoutBy: DEFAULT_LAYOUT_OPTS,
  fisheye: true,
  animate: true,
  undoable: false,
  cueEnabled: false
};

const NODE_HIGHLIGHTED_STYLE = {
    'overlay-color': 'yellow',
    'overlay-padding': 0,
    'overlay-opacity': 0.5
};

const NODE_STYLE_SCRATCH_KEY = '_matched-style-before';

const SHOW_TOOLTIPS_EVENT = 'showtooltip';

const storeStyle = (ele, keys) => {
  const storedStyleProps = {};

  for (let key of keys) {
    storedStyleProps[key] = ele.style(key);
  }

  return storedStyleProps;
};

const applyStyle = (cy, eles, style, scratchKey) => {
  const stylePropNames = Object.keys(style);

  eles.forEach((ele) => {
    ele.scratch(scratchKey, storeStyle(ele, stylePropNames));
  });

  cy.batch(function () {
    eles.style(style);
  });
};

const removeStyle = (cy, eles, scratchKey) => {

  cy.batch(function () {
    eles.forEach((ele) => {
      ele.style(ele.scratch(scratchKey));
      ele.removeScratch(scratchKey);
    });
  });
};

let expandCollapseAll = () => {
  let expanded = true;

  return cy => {
    let api = cy.expandCollapse('get');

    if( expanded ){
      let nodesToCollapse = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isCollapsible(node));
      api.collapseRecursively(nodesToCollapse);
  
    } else {
      let nodesToExpand = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isExpandable(node));
      api.expandRecursively(nodesToExpand);
    }
    expanded = !expanded;
  };
};

let fit = cy => {
  cy.animation({ duration: 250, fit: { padding: 75 }}).play();
};

let layout = cy => {
  cy.layout(DEFAULT_LAYOUT_OPTS).run();
};

let bindCyEvents = cy => {
  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      const tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
        ele.scratch('_tooltip-opened', false);
      }
      ele.unselect();
    });
  };

  cy.expandCollapse(EXPAND_COLLAPSE_OPTS);
  cy.on(SHOW_TOOLTIPS_EVENT, 'node', function (evt) {
    const node = evt.target;

    if(node.data('class') !== "compartment"){
      //Create or get tooltip HTML object
      let tooltip = node.scratch('_tooltip');
      if (!(tooltip)) {
        tooltip = new PathwayNodeMetadataTip(node);
        node.scratch('_tooltip', tooltip);
      }
      tooltip.show();
    }
  });

  cy.on('tap', 'node', evt => {
    const node = evt.target;

    hideTooltips();
    if( !node.scratch('_tooltip-opened') ){
      node.emit(SHOW_TOOLTIPS_EVENT);
      node.scratch('_tooltip-opened', true);
    } else {
      node.scratch('_tooltip-opened', false);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('tap', () => hideTooltips());
  cy.on('drag', () => hideTooltips());
  cy.on('pan', () => hideTooltips());
  cy.on('zoom', () => hideTooltips());
};

let searchNodes = _.debounce((cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let ecAPI = cy.expandCollapse('get');
  let allNodes = cy.nodes().union(ecAPI.getAllCollapsedChildrenRecursively());

  let getSynonyms = node => {
    let parsedMetadata = node.data('parsedMetadata');
    let geneSynonyms = node.data('geneSynonyms');
    let labels = node.data('label')? [node.data('label')]:[node.data('description')];
  
    if (!parsedMetadata) return labels;
  
    //Get Various Names
    let standardName = parsedMetadata.filter(pair => pair[0] === 'Standard Name');
    let names = parsedMetadata.filter(pair => pair[0] === 'Names');
    let displayName = parsedMetadata.filter(pair => pair[0] === 'Display Name');
  
    //Append names to main array
    if (standardName.length > 0){ labels = labels.concat(standardName[0][1]); }
    if (names.length > 0){ labels = labels.concat(names[0][1]); }
    if (displayName.length > 0){ labels = labels.concat(displayName[0][1]); }
  
    if(_.isArray(geneSynonyms)){ labels = labels.concat(node.data('geneSynonyms')); }
  
    return labels.filter(synonym => synonym != null);
  };

  let matched = allNodes.filter(node => {
    let synonyms = getSynonyms(node).filter( synonym => synonym != null);

    let synonymMatch = synonyms.find( synonym => synonym.toUpperCase().includes( query.toUpperCase() ));

    return synonymMatch != null;
  });

  removeStyle(cy, allNodes, NODE_STYLE_SCRATCH_KEY);

  if ( matched.length > 0 && !queryEmpty ) {
    applyStyle(cy, matched, NODE_HIGHLIGHTED_STYLE, NODE_STYLE_SCRATCH_KEY);
  }
}, 300);

let stylesheet = sbgnStyleSheet(cytoscape)
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
.selector('.compoundcollapse-collapsed-node')
.css({
  'font-size': 20,
  'text-max-width': 175
})
.selector('edge')
.css({
  'opacity': 0.3
})
.selector('node[class="and"],node[class="or"],node[class="not"]')
.css({
  'label':node=>node.data('class')
})
.selector('.hidden')
.css({
  'display':'none',
});

module.exports = {
  expandCollapse: expandCollapseAll(),
  fit,
  layout,
  stylesheet,
  bindCyEvents,
  searchNodes,
  DEFAULT_LAYOUT_OPTS
};