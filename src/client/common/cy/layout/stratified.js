const cellularVocabularyOrder = require('./cellularVocabularyOrder');

const stratifiedLayout = function (cy) {
  const bridgeEdges = cy.edges().filter((edge) => {
    return edge.source().parent() !== edge.target().parent();
  });
  bridgeEdges.remove();

  let maxY = 0;

  const compartments = cy.nodes('[class="compartment"]')
    .sort((a, b) => cellularVocabularyOrder(a.data('id')) - cellularVocabularyOrder(b.data('id')));
  const totalChildren = compartments.children().size() ? compartments.children().size() : 1;
  let compartmentRegionX = 100;
  let compartmentRegionY = 100;
  const compartmentRegionW = cy.width();
  const compartmentRegionH = cy.height();  // TODO: this seems buggy, lots of compartments => not enough height


  compartments.forEach(function (compartment) {

    const api = cy.expandCollapse('get');
    const collapsibleNodes = api.collapsibleNodes(cy.nodes('[class="complex"]'));

    api.collapseRecursively(collapsibleNodes);

    let children = compartment.children();
    const childrenProportion = compartment.children().size() / totalChildren;
    const regionH = Math.max(childrenProportion * compartmentRegionH, 100, childrenProportion * 100, children.size() * 10);
    const regionW = Math.min(children.size() * 100, compartmentRegionW);

    const compartmentRegion = {
      x: compartmentRegionX,
      y: compartmentRegionY,
      w: regionW,
      h: regionH
    };
    compartmentRegionY += regionH +  200;
    maxY = compartmentRegionY;
    children = children.move({parent: null});

    children.positions(function (i, ele) {
      const position = {x: compartmentRegion.x + 10, y: compartmentRegion.y + 10};
      return position;
    });

    children.layout({
      name: 'cose',
      boundingBox: {
        x1: compartmentRegion.x,
        y1: compartmentRegion.y,
        w: compartmentRegion.w,
        h: compartmentRegion.h
      },
      padding: 0,
      randomize: true,
      nodeRepulsion: 100000,
      stop: function () {
        const childPosMap = new Map();
        children.nodes().forEach(function (child) {
          let childPos = child.position();

          // sometimes the cose doesnt work for a single node run in the bounding box
          if (isNaN(childPos.x) || isNaN(childPos.y)) {
            childPos = {
              x: compartmentRegion.x + (compartmentRegion.w / 2),
              y: compartmentRegion.y + (compartmentRegion.h / 2)
            };
          }
          childPosMap.set(child.data('id'), childPos);
        });

        children = children.move({parent: compartment.data('id')});
        children.positions(function (child) {
          return childPosMap.get(child.data('id'));
        });
        cy.fit();
      }
    }).run();
  });

  bridgeEdges.restore();

  const floatNodesRegion = {
    x: -1200,
    y: 100,
    w: 1000,
    h: maxY - 100
  };

  const floatingNodes = cy.nodes().filter((node) => {
    return node.data('class') !== 'compartment' && !node.isChild();
  });
  floatingNodes.layout({
    name: 'cose',
    boundingBox: {
      x1: floatNodesRegion.x,
      y1: floatNodesRegion.y,
      w: floatNodesRegion.w,
      h: floatNodesRegion.h
    }
  }).run();

};

module.exports = stratifiedLayout;
