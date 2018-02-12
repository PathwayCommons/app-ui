//Import Depedencies
const express = require('express');
const router = express.Router();

const controller = require('./controller');
const config = require('../../config');

const {validate, proceed } = require('../gene-query');

const enrichment = require("../enrichment");


const isAuthenticated = token => {
  return config.MASTER_PASSWORD != '' && config.MASTER_PASSWORD === token;
};
const errorMsg = {
  error: 'Invalid access token'
};

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

// expose a rest endpoint for validator
router.get('/gene-query/', (req, res) => {
  const genes = req.query.gene;
  console.log("endpoint genes are: "+genes);

  const geneTokens = validate(genes);
  const results = proceed(geneTokens);

  res.json(results);
});

//expose a rest endpoint for enrichment
router.get('/enrichment/', (req, res) => {
  const genes = req.query.gene;
  console.log("endpoint genes are: "+genes);
  enrichment.enrichment(genes).then(function(results) {
    res.json(results);
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