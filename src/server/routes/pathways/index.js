const express = require('express');
const router = express.Router();
const Promise = require('bluebird');
const logger = require('../../logger');

const { getPathwayJson } = require('./generate-pathway-json');

router.get('/', ( req, res ) => {
  let uri = req.query.uri;

  let find = () => getPathwayJson( uri );
  let sendResponse = result => res.json(result);

  ( Promise.try(find)
    .then(sendResponse)
    .catch( err => {
      logger.error( err );
      res.status( 500 ).end( 'Server error' );
    } )
  );
});

module.exports = router;