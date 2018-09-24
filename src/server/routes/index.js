const express = require('express');
const router = express.Router();
const pc = require('./pc');


// router.use('/api', api);
router.use('/pc-client', pc);
router.use('/api/pathways', require('./pathways'));
router.use('/api/interactions', require('./interactions'));
router.use('/api/enrichment', require('./enrichment'));

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */
router.get('*', function (req, res/*, next*/) {
  res.render('index.html');
});

module.exports = router;
