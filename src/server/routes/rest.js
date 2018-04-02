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
  }).catch((invalidInfoError) => {
    res.status(400).send({invalidTarget: invalidInfoError.invalidTarget, invalidOrganism: invalidInfoError.invalidOrganism});
  });
});


// post for gConvert validator
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
  });
});


// expose a rest endpoint for enrichment
// get request
// use default values if the key is undefined
router.get('/enrichment', (req, res) => {
  const genes = req.query.genes;
  const tmpOptions = {};
  tmpOptions.output = req.query.output;
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

// expose a rest endpoint for enrichment
// post request
// use default values if the key is undefined
router.post('/enrichment', (req, res) => {
  const genes = req.body.genes;
  const tmpOptions = {};
  tmpOptions.output = req.body.output;
  tmpOptions.organism = req.body.organism;
  tmpOptions.significant = req.body.significant;
  tmpOptions.sortByStructure = req.body.sortByStructure;
  tmpOptions.orderedQuery = req.body.orderedQuery;
  tmpOptions.asRanges = req.body.asRanges;
  tmpOptions.noIea = req.body.noIea;
  tmpOptions.underrep = req.body.underrep;
  tmpOptions.hierfiltering = req.body.hierfiltering;
  tmpOptions.userThr = req.body.userThr;
  tmpOptions.minSetSize = req.body.minSetSize;
  tmpOptions.maxSetSize = req.body.maxSetSize;
  tmpOptions.thresholdAlgo = req.body.thresholdAlgo;
  tmpOptions.domainSizeType = req.body.domainSizeType;
  tmpOptions.custbg = req.body.custbg;
  tmpOptions.custbgCb = req.body.custbgCb;

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
  try {
    res.json(generateGraphInfo(pathwayIdList));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post('/emap', (req, res) => {
  const pathwayIdList = req.body.pathwayIdList.split(/\s+/);
  const cutoff = req.body.cutoff;
  const JCWeight = req.body.JCWeight;
  const OCWeight = req.body.OCWeight;
  res.json(generateGraphInfo(pathwayIdList, cutoff, JCWeight, OCWeight));
});

// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});

module.exports = router;