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
//  console.log(nodes.nodes[1]);
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
    pcServices.getDataSources(),
    get('Pathway/xref:PublicationXref')
  ])
  .then( ([ title, dataSource, comments, organism, supportedProviders, pubXrefUris ]) => {
    const supportedProvider = supportedProviders.find( supportedProvider => supportedProvider.alias.some( alias => alias === _.head( dataSource ) ) );
    return {
      title: _.head( title ),
      dataSource: _.get( supportedProvider, 'name' ),
      comments,
      organism,
      urlToHomepage: _.get( supportedProvider, 'homepageUrl' ),
      pubXrefUris
    };
  });
}

/**
 * Get the model in different formats (SBGN and BioPAX JSON-LD) for a given URI
 *
 * @param {string} uri URI representing the BioPAX element
 * @returns {Array<string>} Strings of model in formats [sbgnString, jsonldString]
 */
async function getModelStrings(uri) {
  let getSbgn = () => pcServices.query({uri, format: 'sbgn'});
  let getBiopax = () => pcServices.query({uri, format: 'jsonld'});
  const [sbgnString, jsonldString] = await Promise.all([ getSbgn(), getBiopax() ]);
  return [sbgnString, jsonldString];
}

/**
 * Executes a Pathway Commons web query and builds a new JSON network model
 * using the result SBGN (auto-converted to CyJSON) and additional metadata and data
 * from the corresponding BioPAX L3 JSON-LD model and generic entities mapping file (json).
 *
 * @param {*} uri URI representing the network (query)
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
async function getPathwayNodesAndEdges(uri) {
  const [ sbgnString, jsonldString ] = await getModelStrings(uri);
  const cyJson = await sbgn2CyJsonInThread(sbgnString);
  await fillInBiopaxMetadataInThread(cyJson, jsonldString);
  return [cyJson, jsonldString];
}

function fillInPathwayPubXrefs(pathwayData, jsonldString) {
  const { pubXrefUris } = pathwayData;
  if (pubXrefUris == null) return;

  const toJSON = txt => JSON.parse(txt);
  const jsonLD = toJSON(jsonldString);
  const graph = jsonLD['@graph'];
  const getPubXref = uri => {
    const { db, id } = _.find(graph, { '@id': uri });
    return { db, id };
  };
  let pubXrefs = pubXrefUris.map( getPubXref );
  _.set(pathwayData, 'pubXrefs', pubXrefs);
}

/**
 *
 * @param {*} uri URI representing the network
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
async function getPathwayJson(uri) {
  const [cyJson, jsonldString] = await getPathwayNodesAndEdges(uri);
  let pathwayMetadata = await getPathwayMetadata(uri);
  fillInPathwayPubXrefs(pathwayMetadata, jsonldString);
  pathwayMetadata = _.assign({}, pathwayMetadata, { uri: uri });
  return _.assign({}, cyJson, { pathwayMetadata });
}

module.exports = { getPathwayJson };
