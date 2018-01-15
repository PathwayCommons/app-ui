const _ = require('lodash');
const pcServices = require('./../pathway-commons');
const metadataMapperJson = require('./metadataMapperJson');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayMetadata(uri) {

  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pcServices.traverse({uri, path}).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    get('Entity/comment').then(value => comments = value),
    get('Entity/organism/displayName').then(value => organism = value)
  ]).then(data => ({ comments, dataSource, title, organism }));
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri
function getElementMetadata(uri) {
  let sbgn, biopax;

  return Promise.all([
    pcServices.get({uri, format: 'sbgn'}).then(file => sbgn = file),
    pcServices.get({uri, format: 'jsonld'}).then(file => biopax = file)
  ]).then(files => metadataMapperJson(biopax, sbgn));
}

//Return enhanced cytoscape json
//Requires a valid pathway uri 
function getPathwayJson(uri) {

  return getPathwayMetadata(uri).then(pathwayMetadata => {
    return getElementMetadata(uri).then(elementMetadata => {
      const pathwayData = _.assign({}, pathwayMetadata, { uri: uri });
      return _.assign({}, elementMetadata, { pathwayMetadata: pathwayData });
    });
  });
}

module.exports = { getPathwayJson };
