const promiseTimeout = require('./promise');
const _ = require('lodash');

const { FETCH_TIMEOUT } = require('../config');

const failOnBadStatus = res => {
  if(!res.ok){
    throw new Error(`Fetch failed due to bad status code : ${res.statusText} : ${res.url}`);
  } else {
    return res;
  }
};

const safeFetch =  ( url, options ) => {
  const timeout = _.get( options, ['timeout'], FETCH_TIMEOUT );
  const opts = _.omit( options, ['timeout']);
  return promiseTimeout( () => fetch( url, opts ).then( failOnBadStatus ), timeout );
};

module.exports = safeFetch;
