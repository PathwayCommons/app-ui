const Promise = require('bluebird');

const { FETCH_TIMEOUT } = require('../config');

let promiseTimeout = fn => {
  return Promise.resolve().then( fn ).timeout( FETCH_TIMEOUT );
};


module.exports = promiseTimeout;