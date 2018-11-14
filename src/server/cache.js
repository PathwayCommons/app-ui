const hasher = require('node-object-hash')({ sort: true });
const pMemoize = require('p-memoize');

/**
 * @param { Function } The function to cache
 * @param { Object } cache. Default is new Map(). Must implement: .has(key), .get(key), .set(key, value), .delete(key), and optionally .clear().
 */
const cache = (fn, cache, getKey) => {
  getKey = getKey || function(){ return arguments; };

  return pMemoize(fn, {
    cacheKey: function(){
      return hasher.hash(getKey(arguments));
    },
    cache
  });
};

module.exports = cache;