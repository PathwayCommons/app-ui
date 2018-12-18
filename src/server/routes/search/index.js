const express = require('express');
const router = express.Router();

const { search, searchGenes } = require('./search');

router.post('/', function (req, res, next) {
  search( req.body )
    .then( result => res.json( result ) )
    .catch( next );
});

router.post('/genes', ( req, res, next ) => {
  searchGenes( req.body.query )
    .then( result => res.json( result ) )
    .catch( next );
});

module.exports = router;