const sbgnml2CyJson = require('sbgnml-to-cytoscape');
const _ = require('lodash');


const pc = require('./../pathway-commons');
const augmentMetadataToCyJson = require('./biopax-metadata');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(pcUri) {

  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pc.traverse({pcUri, path}).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    get('Entity/comment').then(value => comments = value),
    get('Entity/organism/displayName').then(value => organism = value)
  ]).then(data => ({ comments, dataSource, title, organism }));
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway commons uri
function getCyElementMetadata(pcUri) {
  let cyJson, biopax;

  //Get SBGN and Biopax Files
  return Promise.all([
    pc.get({pcUri, format: 'sbgn'}).then(file => cyJson = sbgnml2CyJson(file)),
    pc.get({pcUri, format: 'jsonld'}).then(file => biopax = file)
  ])
  .then(files => augmentMetadataToCyJson(biopax, cyJson));
}

//Return enhanced cytoscape json
//Requires a valid pathway commons uri
function getCytoscapeJson(pcUri) {
  let pathwayMetadata;

  return getPathwayLevelMetadata(pcUri).then(result =>  {
    pathwayMetadata = result;
    return getCyElementMetadata(pcUri).then(result => {
      result.pathwayMetadata = _.assign({}, pathwayMetadata, {uri: pcUri});
      return result;
    });
  });
}

module.exports = {
  getCytoscapeJson,
  getPathwayLevelMetadata
};
