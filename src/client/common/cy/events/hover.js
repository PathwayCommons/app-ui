const _ = require('lodash');

const {applyStyle, removeStyle} = require('../manage-style');

const dynamicScalingfactors = (zoom) => {
  const scalingFactor = (1 / zoom);
  const defaults = {
    fontSize: 40,
    outlineWidth: 4,
    arrowScale: 3,
    edgeWidth: 2,
  };

  const dynamicFontSize = Math.min(defaults.fontSize, Math.max(scalingFactor * 18, 18));
  const dynamicFontOutlineWidth = Math.min(defaults.outlineWidth, Math.max(scalingFactor * 3, 3));
  const dynamicArrowScale = Math.min(defaults.arrowScale, Math.max(scalingFactor * 2.5, 2.5));
  const dynamicEdgewidth = Math.min(defaults.edgeWidth, Math.max(scalingFactor * 2.5, 2.5));

  return {
    fontSize: dynamicFontSize,
    outlineWidth: dynamicFontOutlineWidth,
    arrowScale: dynamicArrowScale,
    edgeWidth: dynamicEdgewidth
  };
};

const scaledDimensions = (node, zoom) => {
  const nw = node.width();
  const nh = node.height();

  if (nw === 0 || nh === 0) { return { w: 0, h: 0 }; }

  const scaledVal = (1 / zoom) * 8;
  const aspectRatio = nw / nh;
  let xIncr = 0;
  let yIncr = 0;

  if (aspectRatio > 1) {
    xIncr = nw + scaledVal;
    yIncr = nh + (scaledVal / aspectRatio);
  } else {
    xIncr = nw + (scaledVal / aspectRatio);
    yIncr = nh + scaledVal;
  }

  return {
    w: xIncr,
    h: yIncr
  };
};


const baseNodeHoverStyle = {
  'background-color': 'blue',
  'opacity': 1,
  'z-compound-depth': 'top',
  'color': 'white',
  'text-outline-color': 'black'
};

const baseEdgeHoverStyle = {
  'line-color': 'orange',
  'opacity': 1
};

const bindHover = (cy, nodeStyle = baseNodeHoverStyle, edgeStyle = baseEdgeHoverStyle) => {
  cy.on('mouseover', 'node[class!="compartment"]', function (evt) {
    const node = evt.target;
    const currZoom = cy.zoom();

    if (node.isParent() && node.isExpanded()) { return; }

    const { fontSize, outlineWidth, arrowScale, edgeWidth } = dynamicScalingfactors(currZoom);

    node.neighborhood().nodes().union(node).forEach((node) => {
      const { w, h } = scaledDimensions(node, currZoom);

      const nodeHoverStyle = _.assign({}, nodeStyle, {
        'font-size': fontSize,
        'text-outline-width': outlineWidth,
        'width': w,
        'height': h
      });

      applyStyle(cy, node, nodeHoverStyle, '_hover-style-before');
    });

    const edgeHoverStyle = _.assign({}, edgeStyle, {
      'arrow-scale': arrowScale,
      'width': edgeWidth
    });

    applyStyle(cy, node.neighborhood().edges(), edgeHoverStyle, '_hover-style-before');
  });

  cy.on('mouseout', 'node[class!="compartment"]', function (evt) {
    const node = evt.target;
    const neighborhood = node.neighborhood();

    removeStyle(cy, neighborhood.nodes(), '_hover-style-before');
    removeStyle(cy, node, '_hover-style-before');
    removeStyle(cy, neighborhood.edges(), '_hover-style-before');
  });

  cy.on('mouseover', 'edge', function (evt) {
    const edge = evt.target;
    const currZoom = cy.zoom();

    const { fontSize, outlineWidth, arrowScale, edgeWidth } = dynamicScalingfactors(currZoom);

    const edgeHoverStyle = _.assign({}, edgeStyle, {
      'arrow-scale': arrowScale,
      'width': edgeWidth
    });
    applyStyle(cy, edge, edgeHoverStyle, '_hover-style-before');


    edge.source().union(edge.target()).forEach((node) => {
      const { w, h } = scaledDimensions(node, currZoom);
      const nodeHoverStyle = _.assign({}, nodeStyle, {
        'width': w,
        'height': h,
        'font-size': fontSize,
        'color': 'white',
        'text-outline-color': 'black',
        'text-outline-width': outlineWidth,
        'opacity': 1,
        'background-color': 'blue',
        'z-compound-depth': 'top'
      });
      applyStyle(cy, node, nodeHoverStyle, '_hover-style-before');
    });
  });

  cy.on('mouseout', 'edge', function (evt) {
    const edge = evt.target;

    removeStyle(cy, edge, '_hover-style-before');
    removeStyle(cy, edge.source(), '_hover-style-before');
    removeStyle(cy, edge.target(), '_hover-style-before');
  });



};

module.exports = bindHover;