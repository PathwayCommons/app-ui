const express = require('express');
const router = express.Router();

const { getInteractionGraphFromPC } = require('./generate-interactions-json');
const { generateInteractionsImg } = require('./generate-interactions-image');

const logger = require('../../logger');


router.get('/', ( req, res ) => {
  let sources = req.query.sources;

  getInteractionGraphFromPC( sources )
  .then( interactionsJson => res.json({ network: interactionsJson }) )
  .catch( e => {
    logger.error( e );
    res.status( 500 ).end( 'Server error' );
  });
});

router.get('/image', ( req, res ) => {
  let sources = req.query.sources;

  getInteractionGraphFromPC( sources )
  .then( generateInteractionsImg )
  .then( img => res.json( { img } ) )
  // .catch( e => {
  //   logger.error( e );
  //   res.status( 500 ).end( 'Server error' );
  // });
});

module.exports = router;