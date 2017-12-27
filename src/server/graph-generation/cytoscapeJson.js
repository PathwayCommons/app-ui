const pcServices = require('./../pathway-commons');
const metadataMapperJson = require('./metadataMapperJson');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(uri) {

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
function getMetadataJson(uri, parseType) {
  let sbgn, biopax;
  let downloadType = (parseType === 'pc2' ? 'jsonld' : parseType);

  //Get SBGN and Biopax Files
  return Promise.all([
    pcServices.get({uri, format: 'sbgn'}).then(file => sbgn = file),
    pcServices.get({uri, format: downloadType}).then(file => biopax = file)
  ]).then(files => {
    //Map metadata
    if (parseType === 'jsonld') { return metadataMapperJson(biopax, sbgn); }
    else {return null;}
  });
}

//Return enhanced cytoscape json
//Requires a valid pathway uri 
function getCytoscapeJson(uri, parseType = 'jsonld') {
  let pathwayMetadata;

  //Start Generation
  return getPathwayLevelMetadata(uri).then(function (data) {
    pathwayMetadata = data;
    return getMetadataJson(uri, parseType).then(function (data) {
      data.pathwayMetadata = pathwayMetadata;
      data.parseType = parseType;
      return data;
    });
  });
}

module.exports = {
  getCytoscapeJson,
  getPathwayLevelMetadata
};
