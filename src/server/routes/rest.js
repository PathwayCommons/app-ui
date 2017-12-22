//Import Depedencies
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const datasources = require('../../scripts/datasources');


// Expose a rest endpoint for controller.submitLayout
router.post('/submit-layout', function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
    .then((package) => {
      res.json(package);
    });
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

router.get('/datasources', function(req, res) {
  return res.json({datasources: datasources});
});

// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});

module.exports = router;