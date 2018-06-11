//Import Depedencies
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const config = require('../../config');
const { enrichmentRouter } = require('./enrichment-rest');



const isAuthenticated = token => {
  return config.MASTER_PASSWORD != '' && config.MASTER_PASSWORD === token;
};


router.use('/', enrichmentRouter);

// Expose a rest endpoint for controller.submitLayout
router.post('/submit-layout', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.submitGraph
router.post('/submit-graph', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitGraph(req.body.uri, req.body.version, req.body.graph)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.submitDiff
router.post('/submit-diff', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.getGraphAndLayout
router.get('/get-graph-and-layout', function (req, res) {
  controller.getGraphAndLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package);
  });
});

// Expose a rest endpoint for controller.getGraphAndLayout
router.get('/get-interaction-graph', function (req, res) {
  controller.getInteractionGraph(req.query.sources).then((package) => res.json(package));
});

// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});


module.exports = router;