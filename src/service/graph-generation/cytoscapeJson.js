const pcServices = require('./pcServices');
const metadataMapperJson = require('./metadataMapperJson');
const metadataMapperXML = require('./metadataMapperXML');
const metadataMapperPC2 = require('./metadataMapperPC2');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(uri) {

  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pcServices.traversePC2(uri, path).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    get('Entity/comment').then(value => comments = value),
    get('Entity/organism/displayName').then(value => organism = value)
  ]).then(data => ({ comments, dataSource, title, organism }));
};

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri
function getMetadataJson(uri, parseType) {
  let sbgn, biopax;
  let downloadType = (parseType === 'pc2' ? 'jsonld' : parseType);

  //Get SBGN and Biopax Files
  return Promise.all([
    pcServices.getPC2(uri, 'sbgn').then(file => sbgn = file),
    pcServices.getPC2(uri, downloadType).then(file => biopax = file)
  ]).then(files => {
    //Map metadata
    if (parseType === 'jsonld') { return metadataMapperJson(biopax, sbgn); }
    else if (parseType === 'biopax') { return metadataMapperXML(biopax, sbgn); }
    else if (parseType === 'pc2') { return metadataMapperPC2(biopax, sbgn); }
  })
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
    })
  }).catch(function (e) {
    console.log(e);
    return { error: e };
  })
}

module.exports = {
  getCytoscapeJson,
  getPathwayLevelMetadata
};
