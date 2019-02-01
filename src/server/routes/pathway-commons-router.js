//Import Depedencies
const express = require('express');
const pc = require('../external-services/pathway-commons');

const router = express.Router();


router.get('/search', function (req, res) {
  pc.search(req.query).then(r => res.json(r));
});

//for debugging
router.post('/xref2Uri/', function (req, res, next) {
  const { name, localId } = req.body.query;
  pc.xref2Uri( name, localId )
    .then( r => res.json( r ))
    .catch( next );
});


module.exports = router;