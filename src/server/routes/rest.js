//Import Depedencies
const express = require('express');
const router = express.Router();



const controller = require('./controller');
const config = require('../../config');

const { validatorGconvert } = require('../enrichment-map/gene-validator');
const { enrichment } = require('../enrichment-map/enrichment');

const { generateGraphInfo } = require('../enrichment-map/emap');

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

// expose a rest endpoint for gconvert validator
router.post('/gene-query', (req, res) => {
  const genes = req.body.genes;
  const tmpOptions = {};
  const userOptions = {};
  tmpOptions.organism = req.body.organism;
  tmpOptions.target = req.body.target;
  for (const key in tmpOptions) {
    if (tmpOptions[key] != undefined) {
      userOptions[key] = tmpOptions[key];
    }
  }
  validatorGconvert(genes, userOptions).then(gconvertResult => {
    res.json(gconvertResult);
  }).catch((invalidInfoError) => {
    res.status(400).send({invalidTarget: invalidInfoError.invalidTarget, invalidOrganism: invalidInfoError.invalidOrganism});
  });
});


// expose a rest endpoint for enrichment
router.post('/enrichment', (req, res) => {
  const genes = req.body.genes;
  const tmpOptions = {
    orderedQuery: req.body.orderedQuery,
    userThr: req.body.userThr,
    minSetSize: req.body.minSetSize,
    maxSetSize: req.body.maxSetSize,
    thresholdAlgo: req.body.thresholdAlgo,
    custbg: req.body.custbg
  };
  const userOptions = {};
  for (const key in tmpOptions) {
    if (tmpOptions[key] != undefined) {
      userOptions[key] = tmpOptions[key];
    }
  }
  enrichment(genes, userOptions).then(enrichmentResult => {
    res.json(enrichmentResult);
  }).catch((err) => {
    res.status(400).send(err.message);
  });
});

// Expose a rest endpoint for emap
router.post('/emap', (req, res) => {
  const pathwayInfoList = JSON.parse(req.body.pathwayInfoList);
  const cutoff = req.body.cutoff;
  const JCWeight = req.body.JCWeight;
  const OCWeight = req.body.OCWeight;
  try {
    res.json(generateGraphInfo(pathwayInfoList, cutoff, JCWeight, OCWeight));

  } catch (err) {
    res.status(400).send(err.message);
  }
});


// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});

module.exports = router;