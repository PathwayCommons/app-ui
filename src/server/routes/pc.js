//Import Depedencies
const express = require('express');
const cli = require('../pathway-commons');
const router = express.Router();

router.get('/datasources', function (req, res) {
  cli.datasources().then(o => res.json(o));
});

router.get('/querySearch', function (req, res) {
  cli.querySearch(req.query).then(r => res.json(r));
});

router.get('/:path', function (req, res) {
  const cmd = req.params.path;
  req.query.cmd = cmd; //sets the PC command (e.g., 'traverse')
  cli.query(req.query).then(r => (cmd=='get' || cmd=='graph') ? res.text(r) : res.json(r));
});


module.exports = router;