const hasher = require('node-object-hash')();
const isPromise = p => p != null && p.then != null;
const logger = require('./logger');

const cache = (fn, cache) => {
  return function(){
    let hash = hasher.hash(arguments);

    if(cache.has(hash)){
      return cache.get(hash);
    } else {
      let res = fn.apply(null, arguments);

      cache.set(hash, res);

      // for promises, delete the cache entry on errors
      if(isPromise(res)){
        res.catch(err => {
          cache.del(hash);

          logger.error(`A cache failed to be filled with args`);
          logger.error(arguments);
          logger.error(err);
        });
      }

      return res;
    }
  };
};

module.exports = cache;