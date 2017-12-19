
const express = require('express');
const r = require('rethinkdb');
const db = require('../database/utilities');
const config = require('../database/config');
const _ = require('lodash');
const uuid = require('uuid/v4');
const router = express.Router();


function purge(connection) {
  const tenDays = 10 * 60 * 60 * 24;

  return r.db(config.databaseName)
    .table('snapshot')
    .filter(r.row('date').lt(r.now().sub(tenDays)))
    .delete()
    .run(connection)
    .then(res => res.deleted);
}

function add(snapshot, connection) {
  let id = uuid();

  return db.insert('snapshot', { id, snapshot, date: r.now() }, config, connection)
    .then(() => id);
}

function get(id, connection) {
  return r.db(config.databaseName)
    .table('snapshot').get(id)
    .update({ date: r.now() }, {returnChanges: true})
    .run(connection)
    .then(res => _.get(res, 'changes.[0].new_val.snapshot', undefined));
}

router.get('/purge', function (req, res) {
  db.connect()
    .then(connection => purge(connection))
    .then(numDeleted => res.json(numDeleted));
});

router.get('/get', function (req, res) {
  db.connect()
    .then(connection => get(req.query.id, connection))
    .then(snapshot => res.json(snapshot));
});

router.post('/add', function (req, res) {
  let snapshot = req.body.snapshot;

  db.connect()
    .then(connection => add(snapshot, connection))
    .then(uuid => res.json(uuid));
});

module.exports = router;