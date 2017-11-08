const fetch = require('node-fetch');
const convert = require('sbgnml-to-cytoscape');
const cyJson = require('./graph-generation/cytoscapeJson');

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

function queryMetadata(pcID) {
  return cyJson.getCytoscapeJson(pcID);
}

module.exports = {
  queryPC,
  queryMetadata
};