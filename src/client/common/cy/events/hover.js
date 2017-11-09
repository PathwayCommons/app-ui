const _ = require('lodash');

const storeStyle = (ele, keys) => {
  const storedStyleProps = {};

  for (let key of keys) {
    storedStyleProps[key] = ele.style(key);
  }

  return storedStyleProps;
};

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

const applyHoverStyle = (cy, eles, style) => {
  const stylePropNames = Object.keys(style);

  eles.forEach((ele) => {
    ele.scratch('_hover-style-before', storeStyle(ele, stylePropNames));
  });

  cy.batch(function () {
    eles.style(style);
  });
};

const removeHoverStyle = (cy, eles) => {

  cy.batch(function () {
    eles.forEach((ele) => {
      ele.style(ele.scratch('_hover-style-before'));
      ele.removeScratch('_hover-style-before');
    });
  });
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

const bindHover = (cy) => {
  cy.on('mouseover', 'node[class!="compartment"]', function (evt) {
    const node = evt.target;
    const currZoom = cy.zoom();

    const { fontSize, outlineWidth, arrowScale, edgeWidth } = dynamicScalingfactors(currZoom);

    node.neighborhood().nodes().union(node).forEach((node) => {
      const { w, h } = scaledDimensions(node, currZoom);

      const nodeHoverStyle = _.assign({}, baseNodeHoverStyle, {
        'font-size': fontSize,
        'text-outline-width': outlineWidth,
        'width': w,
        'height': h
      });

      applyHoverStyle(cy, node, nodeHoverStyle);
    });

    const edgeHoverStyle = _.assign({}, baseEdgeHoverStyle, {
      'arrow-scale': arrowScale,
      'width': edgeWidth
    });

    applyHoverStyle(cy, node.neighborhood().edges(), edgeHoverStyle);
  });

  cy.on('mouseout', 'node[class!="compartment"]', function (evt) {
    const node = evt.target;
    const neighborhood = node.neighborhood();

    removeHoverStyle(cy, neighborhood.nodes());
    removeHoverStyle(cy, node);
    removeHoverStyle(cy, neighborhood.edges());
  });

  cy.on('mouseover', 'edge', function (evt) {
    const edge = evt.target;
    const currZoom = cy.zoom();

    const { fontSize, outlineWidth, arrowScale, edgeWidth } = dynamicScalingfactors(currZoom);

    const edgeHoverStyle = _.assign({}, baseEdgeHoverStyle, {
      'arrow-scale': arrowScale,
      'width': edgeWidth
    });
    applyHoverStyle(cy, edge, edgeHoverStyle);


    edge.source().union(edge.target()).forEach((node) => {
      const { w, h } = scaledDimensions(node, currZoom);
      const nodeHoverStyle = _.assign({}, baseNodeHoverStyle, {
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
      applyHoverStyle(cy, node, nodeHoverStyle);
    });
  });

  cy.on('mouseout', 'edge', function (evt) {
    const edge = evt.target;

    removeHoverStyle(cy, edge);
    removeHoverStyle(cy, edge.source());
    removeHoverStyle(cy, edge.target());
  });



};

module.exports = bindHover;