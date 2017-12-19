//Import Depedencies
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const snapshot = require('./snapshot');
 
router.use('/snapshot', snapshot);


// Expose a rest endpoint for controller.submitLayout
router.post('/submit-layout', function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
    .then((package) => {
      res.json(package);
    });
});

// Expose a rest endpoint for controller.renderPN
router.post('/render-png', function (req, res) {
  controller.renderPNG(req.body.cyJson)
    .then((package) => {
      res.json(package);
    });
    // }).catch(e => res.json(e));
});

// Expose a rest endpoint for controller.submitGraph
router.post('/submit-graph', function (req, res) {
  controller.submitGraph(req.body.uri, req.body.version, req.body.graph)
    .then((package) => {
      res.json(package);
    });
});

// Expose a rest endpoint for controller.submitDiff
router.post('/submit-diff', function (req, res) {
  controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
    .then((package) => {
      res.json(package);
    });
});

// Expose a rest endpoint for controller.getGraphAndLayout
router.get('/get-graph-and-layout', function (req, res) {
  controller.getGraphAndLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package);
  });
});

// Expose a rest endpoint for controller.getLayoutHistory 
router.get('/get-layout-history', function (req, res) {
  controller.getHistory(req.query.uri, req.query.version, req.query.numEntries).then((package) => {
    res.json(package);
  });
});


// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});

module.exports = router;