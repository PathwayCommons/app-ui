const promiseTimeout = require('./promise');

const failOnBadStatus = res => {
  if(!res.ok){
    throw new Error(`Fetch failed due to bad status code : ${res.statusText} : ${res.url}`);
  } else {
    return res;
  }
};

const safeFetch =  ( url, options ) => {
  return promiseTimeout( () => fetch( url, options ).then( failOnBadStatus ) );
};

module.exports = safeFetch;
