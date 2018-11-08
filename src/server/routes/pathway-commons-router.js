//Import Depedencies
const express = require('express');
const pc = require('../external-services/pathway-commons');

const router = express.Router();


router.get('/search', function (req, res) {
  pc.search(req.query).then(r => res.json(r));
});

//for debugging
router.get('/xref2Uri/:name/:localId', function (req, res) {
  res.set('Content-Type', 'application/json');
  pc.xref2Uri( req.params.name, req.params.localId )
    .then( r => res.json( r ))
    .catch( err => res.end( err.message ) );
});


module.exports = router;