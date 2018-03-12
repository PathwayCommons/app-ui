//Import Depedencies
const express = require('express');
const router = express.Router();

const controller = require('./controller');
const config = require('../../config');

const { validatorGconvert } = require('../enrichment-map/gene-validator');
const { enrichment } = require('../enrichment-map/enrichment');

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

router.get('/gene-query', (req, res) => {
  const genes = req.query.genes;

  validatorGconvert(genes).then(gconvertResult => {
    res.json(gconvertResult);
  });
});

//expose a rest endpoint for enrichment
router.get('/enrichment', (req, res) => {
  const genes = req.query.genes;
  const tmpOptions = {};
  tmpOptions.organism = req.query.organism;
  tmpOptions.significant = req.query.significant;
  tmpOptions.sortByStructure = req.query.sortByStructure;
  tmpOptions.orderedQuery = req.query.orderedQuery;
  tmpOptions.asRanges = req.query.asRanges;
  tmpOptions.noIea = req.query.noIea;
  tmpOptions.underrep = req.query.underrep;
  tmpOptions.hierfiltering = req.query.hierfiltering;
  tmpOptions.userThr = req.query.userThr;
  tmpOptions.minSetSize = req.query.minSetSize;
  tmpOptions.maxSetSize = req.query.maxSetSize;
  tmpOptions.thresholdAlgo = req.query.thresholdAlgo;
  tmpOptions.domainSizeType = req.query.domainSizeType;
  tmpOptions.custbg = req.query.custbg;
  tmpOptions.custbgCb = req.query.custbgCb;

  const userOptions = {};
  for (const key in tmpOptions) {
    if (tmpOptions[key] != undefined) {
      userOptions[key] = tmpOptions[key];
    }
  }

  enrichment(genes, userOptions).then(enrichmentResult => {
    res.json(enrichmentResult);
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