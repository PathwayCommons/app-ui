//Import Depedencies
const express = require('express');
const qs = require('querystring');
const pc = require('../pathway-commons/');
const router = express.Router();
const config = require('../../config');

router.get('/querySearch', function (req, res) {
  pc.search(req.query).then(r => res.json(r));
});

//this is mainly to download and save raw data (with correct content-time) from PC ws directly to client
router.get('/pc2/:path', function (req, res) {
  res.redirect(config.PC_URL + 'pc2/' + req.params.path + '?' + qs.stringify(req.query));
});

//may be useful in future
router.get('/sifgraph/v1/:path', function (req, res) {
  res.redirect(config.PC_URL + 'sifgraph/v1/' + req.params.path + '?' + qs.stringify(req.query));
});


module.exports = router;