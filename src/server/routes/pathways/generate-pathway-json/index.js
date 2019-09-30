const _ = require('lodash');
const Future = require('fibers/future');
const sbgn2CyJson = require('sbgnml-to-cytoscape');

const pcServices = require('../../../external-services/pathway-commons');
const { fillInBiopaxMetadata } = require('./biopax-metadata');

const sbgn2CyJsonInThread = file => {
  let task = Future.wrap(function(file, next){ // code in this block runs in its own thread
    try {
      let res = sbgn2CyJson(file);

      next(null, res);
    } catch( err ){
      next(err);
    }
  });

  return task(file).promise();
};

const fillInBiopaxMetadataInThread = (nodes, biopaxJson) => {
  let task = Future.wrap(function(nodes, biopaxJson, next){ // code in this block runs in its own thread
    try {
      let res = fillInBiopaxMetadata(nodes, biopaxJson);

      next(null, res);
    } catch( err ){
      next(err);
    }
  });

  return task(nodes, biopaxJson).promise();
};

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayMetadata(uri) {

  // let title, dataSource, comments, organism, supportedProviders;
  let get = path => pcServices.query({cmd:'pc2/traverse', uri, path})
    .then(data => _.get(data, 'traverseEntry.0.value', null));

  return Promise.all([
    get('Entity/displayName'),
    get('Entity/dataSource/displayName'),
    get('Entity/comment'),
    get('Pathway/organism/displayName'),
    pcServices.getDataSources() 
  ])
  .then( ([ title, dataSource, comments, organism, supportedProviders ]) => {
    const supportedProvider = supportedProviders.find( supportedProvider => supportedProvider.alias.some( alias => alias === _.head( dataSource ) ) );
    return { 
      title, 
      dataSource: _.get( supportedProvider, 'name' ), 
      comments, 
      organism,
      urlToHomepage: _.get( supportedProvider, 'urlToHomepage' ) 
    };
  });
}

/**
 * Executes a Pathway Commons web query and builds a new JSON network model
 * using the result SBGN (auto-converted to CyJSON) and additional metadata and data
 * from the corresponding BioPAX L3 JSON-LD model and generic entities mapping file (json).
 *
 * @param {*} uri URI representing the network (query)
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
function getPathwayNodesAndEdges(uri) {
  let getSbgn = () => pcServices.query({uri, format: 'sbgn'}).then(file => sbgn2CyJsonInThread(file));
  let getBiopax = () => pcServices.query({uri, format: 'jsonld'});

  return (
    Promise.all([ getSbgn(), getBiopax() ])
    .then( ([ cyJson, biopaxJson ]) => fillInBiopaxMetadataInThread(cyJson, biopaxJson) )
  );
}

/**
 *
 * @param {*} uri URI representing the network
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
function getPathwayJson(uri) {
  let pathwayData, elementData;

  return Promise.all([
    getPathwayMetadata(uri).then(data => pathwayData = _.assign({}, data, { uri: uri })),
    getPathwayNodesAndEdges(uri).then(data => elementData = data)
  ]).then(() => {
    return _.assign({}, elementData, { pathwayMetadata: pathwayData });
  });
}

module.exports = { getPathwayJson };
