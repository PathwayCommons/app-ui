const fetch = require('node-fetch');
const convert = require('sbgnml-to-cytoscape');
const cyJson = require('./graph-generation/cytoscapeJson');

// queryPC(pcID) queries pathway commons to retrieve
// the graph object for a given pcID without retrieving
// any metadata.
function queryPC(pcID) {
  const prefix = 'http://www.pathwaycommons.org/pc2/get?uri=';
  const suffix = '&format=sbgn';

  let url = prefix + pcID + suffix;
  return fetch(url, { method: 'GET', format: 'SBGN' }).then((response) => {
    return response.text();
  }).then((text) => {
    if (!text) {
      return Promise.reject(new Error ('Data could not be retrieved from PC2'));
    }
    return convert(text);
  });
}

// queryForMetadata(pcID) queries pathway commons to retrieve
// the graph object and its associated metadata.
function queryForGraphAndMetadata(pcID) {
  return cyJson.getCytoscapeJson(pcID);
}

module.exports = {
  queryPC,
  queryForGraphAndMetadata
};