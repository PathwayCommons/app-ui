const cytosnap = require('cytosnap');
const _ = require('lodash');

const getRenderOptions = require('./getRenderOptions');

/* renderImage (graphValues)
   Render a collection of images representing cytoscape graphs
   - Requires a valid graphValues object which consists of a layouts field and a graph field
   - Returns a collection of PNGs in base64
*/
function renderImage(graph, layouts) {
  //Create a cytosnap object
  const snap = cytosnap();

  if(!layouts || layouts.length <= 1) {return new Promise(r => r([]));}

  const parents = _.uniq(_.compact(graph.map(element => element.data.parent)));

  return snap.start().then(function () {
    const images = layouts.map(layout => {
      const layoutPositions = _.pickBy(layout.positions, (val, key) => !parents.includes(key));

      const renderJson = getRenderOptions(graph, layoutPositions);
      return snap.shot(renderJson).then(res => ({
        id: layout.id,
        date: layout.date_added,
        img: res
      }));
    });

    return Promise.all(images);
  });
}

module.exports = renderImage; 