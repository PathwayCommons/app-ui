const express = require('express');
const router = express.Router();
const { getInteractionGraphFromPC } = require('./generate-interactions-json');


router.get('/', ( req, res ) => {
  let sources = req.query.sources;

  getInteractionGraphFromPC(sources).then( interactionsJson => res.json(interactionsJson) );
});

module.exports = router;