const express = require('express');
const router = express.Router();
const { getPathwayJson } = require('./generate-pathway-json');


router.get('/', ( req, res ) => {
  let uri = req.query.uri;
  getPathwayJson( uri ).then( pathwayJson => res.json( pathwayJson ) );
});

module.exports = router;