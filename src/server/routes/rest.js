//Import Depedencies
const express = require('express');
const router = express.Router();
const controller = require('./controller');

let submitLayout = function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
    .then((package) => {
      res.json(package);
    });
};

let submitGraph =  function (req, res) {
  controller.submitGraph(req.body.uri, req.body.version, req.body.graph)
    .then((package) => {
      res.json(package);
    });
};

let getGraphAndLayout = function (req, res) {
  controller.getGraphAndLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package);
  });
};

let disconnect = function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
};

let submitDiff =  function (req, res) {
  controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
    .then((package) => {
      res.json(package);
    });
};


router.post('/submit-layout', submitLayout);
router.post('/submit-graoh', submitGraph);
router.post('/submit-diff', submitDiff);
router.get('/get-graph-and-layout', getGraphAndLayout);
router.get('/disconnect', disconnect);

module.exports = router;