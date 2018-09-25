//Import Depedencies
const express = require('express');
const qs = require('querystring');
const pc = require('../external-services/pathway-commons');
const { PC_URL } = require('../../config');

const router = express.Router();


router.get('/search', function (req, res) {
  pc.search(req.query).then(r => res.json(r));
});

//this is mainly to download and save raw data (with correct content-time) from PC ws directly to client
router.get('/:path', function (req, res) {
  res.redirect(PC_URL + 'pc2/' + req.params.path + '?' + qs.stringify(req.query));
});

module.exports = router;