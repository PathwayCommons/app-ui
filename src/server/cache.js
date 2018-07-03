const hasher = require('node-object-hash')();

const cache = (fn, cache) => {
  return function(){
    let hash = hasher.hash(arguments);

    if(cache.has(hash)){
      return cache.get(hash);
    } else {
      let res = fn.apply(null, arguments);

      cache.set(hash, res);

      return res;
    }
  };
};

module.exports = cache;