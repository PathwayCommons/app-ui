const hasher = require('node-object-hash')();
const pMemoize = require('p-memoize');

/**
 * @param { Function } The function to cache
 * @param { Object } cache. Default is new Map(). Must implement: .has(key), .get(key), .set(key, value), .delete(key), and optionally .clear().
 */
const cache = (fn, cache) => {
  return pMemoize(fn, {
    cacheKey: function(){
      return hasher.hash(arguments);
    },
    cache
  });
};

module.exports = cache;