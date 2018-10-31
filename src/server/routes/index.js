const express = require('express');
const router = express.Router();
const pc = require('./pathway-commons-router');
const summary = require('./summary');


router.use('/api/summary', summary);
router.use('/api/pc', pc);
router.use('/api/pathways', require('./pathways'));
router.use('/api/interactions', require('./interactions'));
router.use('/api/enrichment', require('./enrichment'));
router.use('/api/factoids', require('./factoids'));
router.get('/api/test/', (req, res) => { 
  Promise.resolve().then( () => setTimeout( () => res.json({ msg:'hi'}), 10000));
});

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */
router.get('*', function (req, res/*, next*/) {
  res.render('index.html');
});

module.exports = router;
