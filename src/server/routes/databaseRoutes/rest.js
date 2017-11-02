//Import Depedencies
const controller = require('./controller');
const express = require('express');
const router = express.Router();

router.get('/check-edit-key', function (req, res) {
  controller.checkEditKey(req.query.uri, req.query.version, req.query.key)
    .then((pacakge) => {
      res.json(pacakge);
    });
});

router.get('/get-edit-key', function (req, res) {
  controller.getEditKey(req.query.uri, req.query.version, req)
    .then((package) => {
      res.json(package);
    });
});

router.post('/submit', function (req, res) {
  controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.key)
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

module.exports = router;