const express = require('express');
const router = express.Router();
const { entitySearch } = require('./entity');

router.get('/entity/search', function (req, res) {
  let tokens = req.query.q.trim().split(' ');
  entitySearch( tokens ).then( r => res.json( r ) );
});

module.exports = router;