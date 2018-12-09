const Promise = require('bluebird');

let promiseTimeout = ( fn, timeout ) => {
  return Promise.resolve().then( fn ).timeout( timeout );
};


module.exports = promiseTimeout;