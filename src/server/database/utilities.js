
const r = require('rethinkdb');
const config = require('./config');
const _ = require('lodash');

let connect = _.memoize(() => r.connect({host: config.ip, port: config.port}));

// Convenience function to create root for common queries depending on whether
// the desired version of PC is 'latest' or an exact version number
function queryRoot(pcID, releaseID) {
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(config.databaseName).table('version').filter({ pc_id: pcID }).orderBy('release_id').limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(config.databaseName).table('version').filter({ pc_id: pcID }).filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  return (releaseID === 'latest') ? latestQuery : specificQuery;
}

// Convenience generic insert function for inserting a json (data)
// into the table specified by table
function insert(table, data, connection, callback) {
  return r.db(config.databaseName).table(table).insert(data).run(connection, callback);
}

// Convenience function to handle the result of an asynchronous call with
// an optional callback and a returned promise if none is given.
function handleResult(resultPromise, callback) {
  if (callback) {
    resultPromise.then(result => {
      callback(result);
    });
  } else {
    return resultPromise;
  }
}

module.exports = {
  queryRoot,
  insert,
  handleResult,
  connect
};