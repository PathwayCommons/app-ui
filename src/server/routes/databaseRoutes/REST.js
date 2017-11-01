//Import Depedencies
const routes = require('./databaseRoutes');
const express = require('express');
const router = express.Router();


router.get('/check-edit-key', function (req, res) {
  routes.checkEditKey(req.query.uri, req.query.version, req.query.key)
    .then((pacakge) => {
      res.json(pacakge.result);
    });
});

router.get('/get-edit-key', function (req, res) {
  routes.getEditKey(req.query.uri, req.query.version, req)
    .then((package) => {
      res.json(package.result);
    });
});

router.post('/submit', function (req, res) {
  routes.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.key)
    .then((package) => {
      res.json(package.result);
    });
});

router.get('/get', function (req, res) {
  routes.etLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package.result);
  });
});

module.exports = router;