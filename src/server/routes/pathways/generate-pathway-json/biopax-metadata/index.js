const _ = require('lodash');

const { fetch } = require('../../../../../util');
const { xref2Uri } = require('../../../../external-services/pathway-commons');
const { PC_URL } = require('../../../../../config');
const GENERIC_PHYSICAL_ENTITY_URL = PC_URL + 'downloads/generic-physical-entity-map.json';

let extractBiopaxMetadata = ( biopaxJsonEntry, physicalEntityData ) => {
  let xrefLinks = _.get(biopaxJsonEntry, 'xrefLinks', {});
  let entRefEl = _.get(biopaxJsonEntry, 'entRefEl', []);

  let type = _.get(biopaxJsonEntry, '@type', '');
  let datasource = _.get(biopaxJsonEntry, 'dataSource', '');
  let comments = _.get(biopaxJsonEntry, 'comment', []);

  let entryDisplayName = _.get(biopaxJsonEntry, 'displayName', '');
  let entryNames = [].concat(_.get(biopaxJsonEntry, 'name', []));
  let entryStdName = _.get(biopaxJsonEntry, 'standardName', '');

  let entRefNames = _.get(entRefEl, 'name', []);
  let entRefStdName = _.get(entRefEl, 'standardName', '');
  let entRefDisplayName = _.get(entRefEl, 'displayName', '');

  let genericPhysicalEntitySynonyms = physicalEntityData || [];

  let synonyms = (
    _.uniq(
      _.flatten( [entryNames, entRefNames, genericPhysicalEntitySynonyms] )
    ).filter( name => !_.isEmpty( name ) )
  );

  let standardName = entryStdName || entRefStdName || '';
  let displayName = entryDisplayName || entRefDisplayName || '';

  return {
    comments,
    synonyms,
    datasource,
    type: type.includes(':') ? type.split(':')[1] : type,
    standardName,
    displayName,
    xrefLinks
  };
};

// transform biopaxJson into a consolidated js object
let biopaxText2ElementMap = async ( biopaxJson, xrefSuggester ) => {
  let rawMap = new Map();
  let elementMap = new Map();
  let xRefMap = new Map();

  let biopaxElementGraph = biopaxJson['@graph'];
  let externalReferences = [];

  biopaxElementGraph.forEach( element => {
    if( _.has(element, '@id') ){
      rawMap.set(element['@id'], element);
    }

    if( _.has(element, 'xref' ) ){
      externalReferences.push(element);
    }
  });

  // extract db ids from specific elements that have 'db' and 'id' fields
  externalReferences.forEach( element => {
    let xrefs = [].concat(_.get(element, 'xref', []));

    xrefs.forEach( xrefId => {
      if( rawMap.has( xrefId ) ){
        let { db, id } = rawMap.get( xrefId );

        if( !db || !id ) return;
        xRefMap.set(xrefId, { k: db, v: id });
      }
    });
  });

  for ( const element of biopaxElementGraph ){
    let entityReference = _.get(element, 'entityReference', null);
    let xrefIds = [].concat( _.get(element, 'xref', []) );
    let elementId = _.get(element, '@id');
    let entRefEl = rawMap.get( entityReference );
    const xrefLinks = {};

    if( entRefEl != null ){
      let entRefXrefs = _.get(entRefEl, 'xref', []);
      xrefIds = xrefIds.concat( entRefXrefs );
    }

    const filtXrefIds = xrefIds.filter( xrefId => xrefId != null );
    for ( const xrefId of filtXrefIds ) {
      if( xRefMap.has( xrefId ) ){
        const { k, v } = xRefMap.get( xrefId );
        try {
          const { uri, namespace } = await xrefSuggester( k, v );
          if( xrefLinks[ namespace ] != null ){
            xrefLinks[ namespace ] = xrefLinks[ namespace ].concat( uri );
          } else {
            xrefLinks[ namespace ] = [ uri ];
          }
        } catch( err ) {
          //swallow
        }
      }
    }

    // each 'element' does not contain all of the data we need, it
    // is scattered across various xref elements and entityReference elements.
    // we merge all this data into one object for easy processing
    elementMap.set( elementId, _.assign( element, { xrefLinks, entRefEl } ) );
  }

  return elementMap;
};


let fillInBiopaxMetadata = async ( cyJsonEles, biopaxJson ) => {
  let nodes = cyJsonEles.nodes;

  let bm = await biopaxText2ElementMap( biopaxJson, xref2Uri );
  let physicalEntityData = await getGenericPhyiscalEntityData( nodes );

  nodes.forEach( node => {
    let nodeId = node.data.id;
    let altId = nodeId.substring(0, nodeId.lastIndexOf('_'));
    node.data.metadata = {};

    // a hack for certain nodes that have id like '<pc_uri>_<hash>' (due to how the biopax-to-sbgn converter works)
    if( bm.has( nodeId ) ){
      node.data.metadata = extractBiopaxMetadata( bm.get(nodeId), physicalEntityData[nodeId] );
    } else if( bm.has( altId ) ){
      node.data.metadata = extractBiopaxMetadata( bm.get(altId), physicalEntityData[nodeId] );
    }
  });
//  console.log("bm: ", bm.get(nodes[1].data.id));
//  console.log(nodes[1].data.id+": ", nodes[1]);
//  console.log("synonyms: ", nodes[1].data.metadata.synonyms);
  return cyJsonEles;
};

let genericPhysicalEntityMapCache = null;
const toJSON = res => res.json();
const asMap = json => new Map( _.toPairs( json ) );
const updateGenericPhysicalEntityMapCache = async () => {
  return fetch( GENERIC_PHYSICAL_ENTITY_URL )
    .then( toJSON )
    .then( asMap )
    .then( m =>  genericPhysicalEntityMapCache = m );
};

const getGenericPhysicalEntityMap = async () => {
  if ( _.isNull( genericPhysicalEntityMapCache ) ) await updateGenericPhysicalEntityMapCache();
  return genericPhysicalEntityMapCache;
};

let getGenericPhyiscalEntityData = async nodes => {
  let nodeGeneSynonyms = {};
  let genericPhysicalEntityMap = await getGenericPhysicalEntityMap();

  nodes.forEach(node => {
    let genericPE = genericPhysicalEntityMap.get(node.data.id);
    let syns = _.get(genericPE, 'synonyms', []);
    if( syns == null) { syns = []; }
    nodeGeneSynonyms[node.data.id] = syns;
  });

  return nodeGeneSynonyms;
};


module.exports = { fillInBiopaxMetadata, biopaxText2ElementMap, extractBiopaxMetadata };