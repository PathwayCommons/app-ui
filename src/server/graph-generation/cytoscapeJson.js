const pcServices = require('./pcServices');
const metadataMapperJson = require('./metadataMapperJson');
const metadataMapperXML = require('./metadataMapperXML');
const metadataMapperPC2 = require('./metadataMapperPC2');

//Debug code (Ignore)
const fs = require('fs');
//http://identifiers.org/reactome/R-HSA-6804754
//http://identifiers.org/kegg.pathway/hsa00260
var x = getCytoscapeJson('http://identifiers.org/kegg.pathway/hsa00260').then(data => fs.writeFileSync('testFile', JSON.stringify(data)));

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(uri) {
  var title, dataSource, comments, organism;

  //Get title
  return pcServices.traversePC2(uri, 'Named/displayName').then(function (data) 
{  title = data.traverseEntry[0].value;

    //Get data source
    return pcServices.traversePC2(uri, 'Entity/dataSource/displayName').then(function (data) {
      dataSource = data.traverseEntry[0].value;

      //Get comments
      return pcServices.traversePC2(uri, 'Entity/comment').then(function (data) {
        comments = data.traverseEntry[0].value;

        //Get organism name
        return pcServices.traversePC2(uri, 'Entity/organism/displayName').then(function (data) {
          organism = data.traverseEntry[0].value;

          //Return pathway metadata
          return {
            comments: comments,
            dataSource: dataSource,
            title: title,
            organism: organism
          };

        })
      });
    });
  });
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri
function getMetadataJson(uri, parseType) {
  var sbgn, biopax;

  //Get SBGN XML
  return pcServices.getPC2(uri, 'sbgn').then(function (data) {
    sbgn = data;

    var downloadType = (parseType === 'pc2' ? 'jsonld' : parseType);

    //Get BioPax XML
    return pcServices.getPC2(uri, downloadType).then(function (data) {
      biopax = data;

      //Map metadata
      //return metadataMapper(biopax, sbgn);
      if (parseType === 'jsonld') { return metadataMapperJson(biopax, sbgn); }
      else if (parseType === 'biopax') { return metadataMapperXML(biopax, sbgn);} 
      else if (parseType === 'pc2') {return metadataMapperPC2(biopax, sbgn);} 
    })
  });
}

//Return enhanced cytoscape json
//Requires a valid pathway uri 
function getCytoscapeJson(uri, parseType = 'jsonld') {
  var pathwayMetadata;

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
  getCytoscapeJson: getCytoscapeJson,
  getPathwayLevelMetadata: getPathwayLevelMetadata
};
