const pcServices = require('./pcServices');
const metadataMapperJson = require('./metadataMapperJson');
const metadataMapperXML = require('./metadataMapperXML');
const metadataMapperPC2 = require('./metadataMapperPC2');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(uri) {
  let title, dataSource, comments, organism;

  return (Promise.resolve(pcServices.traversePC2(uri, 'Named/displayName'))
    .then(data => {
      title = data.traverseEntry[0].value;
      return pcServices.traversePC2(uri, 'Entity/dataSource/displayName');
    })
    .then(data => {
      dataSource = data.traverseEntry[0].value;
      return pcServices.traversePC2(uri, 'Entity/comment');
    })
    .then(data => {
      comments = data.traverseEntry[0].value;
      return pcServices.traversePC2(uri, 'Entity/organism/displayName');
    })
    .then(data => {
      organism = data.traverseEntry[0].value;
      return {
        comments,
        dataSource,
        title,
        organism
      }
    }));
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri
function getMetadataJson(uri, parseType) {
  let sbgn, biopax;

  //Get SBGN XML
  return pcServices.getPC2(uri, 'sbgn').then(function (data) {
    sbgn = data;

    let downloadType = (parseType === 'pc2' ? 'jsonld' : parseType);

    //Get BioPax XML
    return pcServices.getPC2(uri, downloadType).then(function (data) {
      biopax = data;

      //Map metadata
      if (parseType === 'jsonld') { return metadataMapperJson(biopax, sbgn); }
      else if (parseType === 'biopax') { return metadataMapperXML(biopax, sbgn); }
      else if (parseType === 'pc2') { return metadataMapperPC2(biopax, sbgn); }
    })
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
