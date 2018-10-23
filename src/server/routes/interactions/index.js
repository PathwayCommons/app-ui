const express = require('express');
const router = express.Router();
const cytosnap = require('cytosnap');

const { getInteractionGraphFromPC } = require('./generate-interactions-json');

const logger = require('../../logger');

let snap = cytosnap();

router.get('/', ( req, res ) => {
  let sources = req.query.sources;

  getInteractionGraphFromPC( sources ).then( interactionsJson => res.json(interactionsJson) );
});

router.get('/image', ( req, res ) => {
  let sources = req.query.sources;

  snap.start().then( () => getInteractionGraphFromPC( sources ) )
  .then( interactionsJson => {
    let { network } = interactionsJson;
    return snap.shot({
      elements: network,
      layout: { name: 'concentric', minNodeSpacing: 50 },
      style: [
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
      ],
      resolvesTo: 'base64uri',
      format: 'png',
      width: 640,
      height: 460,
      background: 'transparent'
    });
  })
  .then( img => {
    res.json(img);
  })
  .catch( e => {
    logger.error( e );
    res.status( 500 ).end( 'Server error' );
  });
});

module.exports = router;