const db = require('./accessDB.js');
const r = require('rethinkdb');
var connection = null;

r.connect({ host: 'localhost', port: 28015 })
  .then(function (conn) {
    connection = conn;
    return db.setDatabase('testLayouts', connection);
  }).then(() => {
    return Promise.all([
      // pcid, release, data,  connection
      db.updateGraph('2', '9', 'I am a graph', connection),
      db.updateGraph('3', '9', 'also a graph', connection),
      db.updateGraph('2', '10', 'new version', connection)

    ]);
  }).then(() => {
    return Promise.all([
      db.updateGraph('2','11', 'new version', connection)
    ]);
  }).then(() => {
    return Promise.all([
      db.getGraphAndLayout('2', '9', connection),
      db.getGraphAndLayout('3', '9', connection),
      db.getGraphAndLayout('2', 'latest', connection),
      db.getGraphID('2', 'latest', connection)
    ]);
  }).then((result) => {

    console.log(result);
  });