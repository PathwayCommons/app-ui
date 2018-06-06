//Import Depedencies
const express = require('express');
const qs = require('querystring');
const pc = require('../pathway-commons/');
const router = express.Router();
const config = require('../../config');

router.get('/datasources', function (req, res) {
  pc.datasources().then(o => res.json(o));
});

router.get('/querySearch', function (req, res) {
  pc.querySearch(req.query).then(r => res.json(r));
});

//this is mainly to download and save raw data (with correct content-time) from PC ws directly to client
router.get('/:path', function (req, res) {
  res.redirect(config.PC_URL + req.params.path + '?' + qs.stringify(req.query));
});


module.exports = router;