const express = require('express');
const router = express.Router();
const { getPathwayJson } = require('./generate-pathway-json');


router.get('/', ( req, res ) => {
  let uri = req.query.uri;
  let pathwayJson = getPathwayJson(uri);

  res.json(pathwayJson);
});

module.exports = router;