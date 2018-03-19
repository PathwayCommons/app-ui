//Import Depedencies
const express = require('express');
const router = express.Router();



const controller = require('./controller');
const config = require('../../config');

const { validatorGconvert } = require('../enrichment-map/gene-validator');
const { enrichment } = require('../enrichment-map/enrichment');

const { generateCys } = require('../enrichment-map/emap');

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

// Expose a rest endpoint for gconvert validator
// optional paramter: target, organism
// use default values if not specified
router.get('/gene-query', (req, res) => {
  const genes = req.query.genes;
  const tmpOptions = {};
  const userOptions = {};
  tmpOptions.organism = req.query.organism;
  tmpOptions.target = req.query.target;
  for (const key in tmpOptions) {
    if (tmpOptions[key] != undefined) {
      userOptions[key] = tmpOptions[key];
    }
  }

  validatorGconvert(genes, userOptions).then(gconvertResult => {
    res.json(gconvertResult);
  });
});

// expose a rest endpoint for enrichment
// get request
// use default values if the key is undefined
router.get('/enrichment', (req, res) => {
  const genes = req.query.genes;
  const tmpOptions = {};
  tmpOptions.ordered_query = req.query.orderedQuery;
  tmpOptions.user_thr = req.query.userThr;
  tmpOptions.min_set_size = req.query.minSetSize;
  tmpOptions.max_set_size = req.query.maxSetSize;
  tmpOptions.threshold_algo = req.query.thresholdAlgo;
  tmpOptions.custbg = req.query.custbg;
  tmpOptions.custbg_cb = req.query.custbgCb;

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

// expose a rest endpoint for enrichment
// post request
// use default values if the key is undefined
router.post('/enrichment', (req, res) => {
  const genes = req.body.genes;
  const tmpOptions = {};

  tmpOptions.ordered_query = req.query.orderedQuery;
  tmpOptions.user_thr = req.query.userThr;
  tmpOptions.min_set_size = req.query.minSetSize;
  tmpOptions.max_set_size = req.query.maxSetSize;
  tmpOptions.threshold_algo = req.query.thresholdAlgo;
  tmpOptions.custbg = req.query.custbg;
  tmpOptions.custbg_cb = req.query.custbgCb;


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

// Expose a rest endpoint for emap
router.get('/emap', (req, res) => {
  const pathwayIdList = req.query.pathwayIdList.split(/\s+/);
  res.json(generateCys(pathwayIdList));
});

// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});

module.exports = router;