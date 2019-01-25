const { promiseTimeout, TimeoutError } = require('./promise');
const _ = require('lodash');

const { CLIENT_FETCH_TIMEOUT, SERVER_FETCH_TIMEOUT } = require('../config');

const isClient = () => typeof window !== typeof undefined;
const isServer = () => !isClient();

const failOnBadStatus = res => {
  if(!res.ok){
    throw new Error(`Fetch failed due to bad status code : ${res.statusText} : ${res.url}`);
  } else {
    return res;
  }
};

const safeFetch =  ( url, options ) => {
  const FETCH_TIMEOUT = isServer() ? SERVER_FETCH_TIMEOUT : CLIENT_FETCH_TIMEOUT;
  const timeout = _.get( options, ['timeout'], FETCH_TIMEOUT );
  const opts = _.omit( options, ['timeout']);
  return promiseTimeout( () => fetch( url, opts ).then( failOnBadStatus ), timeout );
};

module.exports = { safeFetch, TimeoutError };
