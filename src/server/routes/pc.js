//Import Depedencies
const express = require('express');
const qs = require('querystring');
const pc = require('../pathway-commons/');
const router = express.Router();
const gq = require('../gene-query/validate');

router.get('/datasources', function (req, res) {
  pc.datasources().then(r => res.json(r));
});

router.get('/querySearch', function (req, res) {
  pc.querySearch(req.query).then(r => res.json(r));
});

// router.get('/gene-query', function (req, res) {
//   gq.proceed(req.query).then(r => res.json(r));
// });

router.get('/:path', function (req, res) {
  res.redirect('http://www.pathwaycommons.org/pc2/' + req.params.path + '?' + qs.stringify(req.query));
});

module.exports = router;