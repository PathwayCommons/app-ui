const r = require('rethinkdb');
const config = require('./config');
const _ = require('lodash');
const pcServices = require('../pathway-commons');

let connect = _.memoize((conf) => {
  conf = conf || config;
  return r.connect({ host: conf.host, port: conf.port });
});

// Convenience function to create root for common queries depending on whether
// the desired version of PC is 'latest' or an exact version number
function queryRoot(pcID, releaseID, conf) {
  conf = conf || config;
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(conf.databaseName)
    .table('version')
    .filter({ pc_id: pcID })
    .orderBy('release_id')
    .limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(conf.databaseName)
    .table('version')
    .filter({ pc_id: pcID })
    .filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  return (releaseID === 'latest') ? latestQuery : specificQuery;
}

// Convenience generic insert function for inserting a json (data)
// into the table specified by table
function insert(table, data, config, connection, callback) {
  return r.db(config.databaseName).table(table).insert(data).run(connection, callback);
}

// Convenience function to handle the result of an asynchronous call with
// an optional callback and a returned promise if none is given.
function handleResult(resultPromise, callback) {
  if (callback) {
    let promSuccess = false;
    resultPromise.then(result => {
      promSuccess = true;
      callback(result);
    }).catch(e => {
      // don't do this if the callback resulted in an error
      if (!promSuccess) {
        callback(null, e);
      }
    });
  } else {
    return resultPromise;
  }
}

function getLatestPCVersion(pcID) {
  // Traverse queries to PC2 return the current PC2 version.
  return pcServices.traverse({ format: 'JSON', path: 'Named/name', uri: pcID }).then((json) => {
    return json.version;
  });
}

module.exports = {
  queryRoot,
  insert,
  handleResult,
  connect,
  getLatestPCVersion
};