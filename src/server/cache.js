const hasher = require('node-object-hash')({ sort: true });
const pMemoize = require('p-memoize');
const mem = require('mem');

const defaultGetKey = function(arguments){ return arguments; };

/**
 * @param { Function } The promise function to cache
 * @param { Object } cache. Default is new Map(). Must implement: .has(key), .get(key), .set(key, value), .delete(key), and optionally .clear().
 * @param { Function } getKey Gets the cache key for the specified arguments.
 */
const cachePromise = (fn, cache = new Map(), getKey = defaultGetKey) => {
  return pMemoize(fn, {
    cacheKey: function(){
      return hasher.hash(getKey.apply(null, arguments));
    },
    cache
  });
};

/**
 * @param { Function } The non-promise function to cache
 * @param { Object } cache. Default is new Map(). Must implement: .has(key), .get(key), .set(key, value), .delete(key), and optionally .clear().
 * @param { Function } getKey Gets the cache key for the specified arguments.
 */
const cache = (fn, cache = new Map(), getKey = defaultGetKey) => {
  return mem(fn, {
    cacheKey: function(){
      let key = getKey.apply(null, arguments);

      return hasher.hash(key);
    },
    cache
  });
};

module.exports = { cache, cachePromise };