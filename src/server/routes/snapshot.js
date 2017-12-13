
const express = require('express');
const router = express.Router();
const controller = require('./controller');

const daysBeforePurge = 10;

router.get('/purge', function (req, res) {
  return controller.purgeSnapshot(daysBeforePurge)
    .then(numDeleted => res.json(numDeleted));
});

router.get('/get', function (req, res) {
  return controller.getSnapshot(req.query.id)
    .then(snapshot => res.json(snapshot));
});

router.post('/add', function (req, res) {
  let snapshot = req.body.snapshot;

  return controller.addSnapshot(snapshot)
    .then(uuid => res.json(uuid));
});

module.exports = router;