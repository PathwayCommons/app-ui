const express = require('express');
const router = express.Router();

router.post('/paint', function(req, res, next) {
  res.render('paint');
});

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */
router.get('*', function(req, res, next) {
  res.render('index');
});

module.exports = router;
