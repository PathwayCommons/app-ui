const cytosnap = require('cytosnap');
const QuickLRU = require('quick-lru');

const cache = require('../../cache');

const { PC_CACHE_MAX_SIZE } = require('../../../config');

let snap = cytosnap();

let snapshotInteractionsLayout = network => ({
  name: 'concentric',
  minNodeSpacing: network.nodes.length > 3 ? 5 : 50,
  fit: network.nodes.length > 3 ? false : true,
  padding: 0
});

// a cytoscape jsonstylesheet that is compatible with cytosnap
// it contains fewer properties than the client side interactions app
let snapshotInteractionsStylesheet = [
  {
    selector: 'edge',
    style: {
      'opacity': 0.4,
      'line-color': '#555',
      'width': 4,
      'curve-style': 'haystack',
      'haystack-radius': 0.25
    }
  },
  {
    selector: 'node',
    style: {
      'font-size': 20,
      'color': '#fff',
      'background-color': '#555',
      'text-outline-color': '#555',
      'text-outline-width': 4,
      'width': 50,
      'height': 50,
      'label': 'data(id)',
      'text-halign': 'center',
      'text-valign': 'center'
    }
  },
  {
    selector: '.Modification',
    style: {
      'line-color': '#ffc28b'
    }
  },
  {
    selector: '.Binding',
    style: {
      'line-color': '#8bd8dd'
    }
  },
  {
    selector: '.Expression',
    style: {
      'line-color': '#f4a2a3'
    }
  },
  {
    selector: '.Other',
    style: {
      'line-color': '#949494'
    }
  },
  {
    selector: 'node[?queried]',
    style: {
      'display': 'element',
      'width': 75,
      'height': 75
    }
  }
];


let generateInteractionsImg = interactionsJson => {
  return snap.start().then( () => {
    return snap.shot({
      elements: interactionsJson,
      layout: snapshotInteractionsLayout(interactionsJson),
      style: snapshotInteractionsStylesheet,
      resolvesTo: 'base64uri',
      format: 'png',
      width: 740,
      height: 200,
      background: 'transparent'
    });
  });
};

let imgCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });


module.exports = { generateInteractionsImg: cache(generateInteractionsImg, imgCache) };
