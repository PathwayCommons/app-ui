const express = require('express');
const router = express.Router();

const restRoutes = require('./databaseRoutes/rest');

router.post('/submit-layout', restRoutes.submitLayout);
router.post('/submit-graoh', restRoutes.submitGraph);
router.post('/submit-diff', restRoutes.submitDiff);
router.get('/get-graph-and-layout', restRoutes.getGraphAndLayout);
router.get('/disconnect', restRoutes.disconnect);

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */
router.get('*', function (req, res, next) {
  res.render('index.html');
});




module.exports = router;
