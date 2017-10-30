const fetch = require('node-fetch');
const convert = require('sbgnml-to-cytoscape');
const cyJson = require('./../service/graph-generation/cytoscapeJson');

function queryPC(pcID) {
  const prefix = 'http://www.pathwaycommons.org/pc2/get?uri=';
  const suffix = '&format=sbgn';

  var url = prefix + pcID + suffix;
  return fetch(url, { method: 'GET', format: 'SBGN' }).then((response) => {
    return response.text();
  }).then((text) => {
    if (!text) {
      return null;
    }
    return convert(text);
  });
}

function queryMetadata(pcID) {
  return cyJson.getCytoscapeJson(pcID).then((result) => {
    return result;
  });
}

module.exports = {
  queryPC,
  queryMetadata
};