const convert = require('sbgnml-to-cytoscape');
const cyJson = require('./graph-generation/cytoscapeJson');
const pcServices = require('./pcServices');

// queryPC(pcID) queries pathway commons to retrieve
// the graph object for a given pcID without retrieving
// any metadata.
function queryPC(pcID) {
  return pcServices.get({uri:pcID, format: 'sbgn'}).then((text) => {
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