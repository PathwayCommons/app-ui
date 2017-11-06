//Import Depedencies
const controller = require('./controller');
const express = require('express');
const router = express.Router();

router.post('/submit', function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout)
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
  controller.getLayout(req.query.uri, req.query.version).then((package) => {
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
  console.log(Object.keys(req));
  console.log(Object.keys(req.client));
  console.log(req.connection.remoteAddress);
  controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
  .then((package)=>{
    res.json(package);
  });
});

module.exports = router;