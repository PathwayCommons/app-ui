const _ = require('lodash');

const DEFAULT_RESPONSE = {
  ok: true,
  statusText: 'OK',
  url: 'http://example.org',
  json: () => {}
};

/*
 * mockFetch
 * Used to mock out the global.fetch
 * @param { object } responseOpts Response attributes to add or overwrite
 * @return { Promise } fulfilled with Response
 */
const mockFetch = responseOpts => () => {
  const mockResponse = _.assign( {}, DEFAULT_RESPONSE, responseOpts );
  return new Promise( resolve => resolve( mockResponse ) );
};

module.exports = { mockFetch };
