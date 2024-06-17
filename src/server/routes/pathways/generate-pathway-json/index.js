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
function getPathwayMetadata( uri, biopaxJson ) {

  const getPathwayPubXrefs = ( pubXrefUris = [] )=> {
    const graph = biopaxJson['@graph'];
    const getPubXref = uri => {
      const { db, id } = _.find(graph, { '@id': uri });
      return { db, id };
    };
    return pubXrefUris.map( getPubXref );
  };

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
    const pubXrefs = getPathwayPubXrefs( pubXrefUris );

    return {
      uri,
      title: _.head( title ),
      dataSource: _.get( supportedProvider, 'name' ),
      comments,
      organism,
      urlToHomepage: _.get( supportedProvider, 'homepageUrl' ),
      pubXrefs
    };
  });
}

/**
 * Retrieve the model in SBGN and (BioPAX) JSON-LD format
 *
 * @param {string} uri URI representing the BioPAX element
 * @returns {Array<object>} Model in SBGN-ML and JSON-LD formats
 */
async function getModel( uri ) {
  const toJSON = str => JSON.parse( str );
  let getSbgn = () => pcServices.query({ uri, format: 'sbgn' });
  let getBiopax = () => pcServices.query({ uri, format: 'jsonld' });
  const [ sbgn, biopaxJsonStr ] = await Promise.all([ getSbgn(), getBiopax() ]);
  const biopaxJson = toJSON( biopaxJsonStr );
  return ([ sbgn, biopaxJson ]);
}

/**
 * Builds a new JSON network model using an SBGN-ML (auto-converted to CyJSON) and additional metadata and data
 * from the corresponding BioPAX L3 JSON-LD model and generic entities mapping file (json).
 *
 * @param {string} sbgn The sbgn representation of the network
 * @param {string} biopaxJson The JSON-LD representation of the network
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
async function getPathwayNodesAndEdges( sbgn, biopaxJson ) {
  const cyJson = await sbgn2CyJsonInThread( sbgn );
  await fillInBiopaxMetadataInThread( cyJson, biopaxJson );
  return cyJson;
}

/**
 *  Retrieve a Cytoscape JSON representation alongside pathway metadata
 *
 * @param {string} uri URI representing the network
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
async function getPathwayJson( uri ) {
  const [ sbgn, biopaxJson ] = await getModel( uri );
  const cyJson = await getPathwayNodesAndEdges( sbgn, biopaxJson );
  const pathwayMetadata = await getPathwayMetadata( uri, biopaxJson );
  return _.assign( {}, cyJson, { pathwayMetadata } );
}

module.exports = { getPathwayJson };
