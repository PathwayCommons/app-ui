const express = require('express');
const router = express.Router();

const { search } = require('./search');

router.post('/', function (req, res, next) {
  search( req.body )
    .then( result => res.json( result ) )
    .catch( next );
});

module.exports = router;