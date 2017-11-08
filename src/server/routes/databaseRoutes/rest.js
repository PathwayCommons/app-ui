//Import Depedencies
const controller = require('./controller');
const express = require('express');
const router = express.Router();

router.post('/submit-layout', function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
    .then((package) => {
      res.json(package);
    });
});

router.post('/submit-graph', function(req,res){
  controller.submitGraph(req.body.uri, req.body.version, req.body.graph)
    .then((package)=>{
      res.json(package);
    });
});

router.get('/get', function (req, res) {
  controller.getGraphAndLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package);
  });
});

router.get('/disconnect', function(req,res){
  controller.endSession(req.query.uri, req.query.version, req.query.user)
  .then((package)=>{
    res.json(package);
  });

});

router.post('/submit-diff', function(req,res){
  controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
  .then((package)=>{
    res.json(package);
  });
});

module.exports = router;