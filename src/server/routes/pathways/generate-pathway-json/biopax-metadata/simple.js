const _ = require('lodash');

let extractBiopaxMetadata = biopaxJsonEntry => {
  let type = _.get(biopaxJsonEntry, '@type', '');
  let datasource = _.get(biopaxJsonEntry, 'dataSource', '');
  let displayName = _.get(biopaxJsonEntry, 'displayName', '');
  let synonyms = _.get(biopaxJsonEntry, 'name', []);
  let standardName = _.get(biopaxJsonEntry, 'standardName', '');
  let comments = _.get(biopaxJsonEntry, 'comment', []);
  let databaseIds = _.get(biopaxJsonEntry, 'dbIds', []);

  return {
    comments,
    synonyms,
    datasource,
    type: type.includes(':') ? type.split(':')[1] : type,
    standardName,
    displayName,
    databaseIds
  };
};

// transform biopaxJsonText into a consolidated js object
let biopaxText2ElementMap = biopaxJsonText => {
  let rawMap = new Map();
  let elementMap = new Map();
  let xRefMap = new Map();

  let biopaxElementGraph = JSON.parse(biopaxJsonText)['@graph'];
  let externalReferences = [];

  biopaxElementGraph.forEach( element => {
    let uri = element['@id'];
    rawMap.set(uri, element);

    if( _.has(element, 'xref' ) ){
      externalReferences.push(element);
    }
  });

  // extract db ids from specific elements that have 'db' and 'id' fields
  externalReferences.forEach( element => {
    let xRefElementId = _.get(element, '@id');
    let xrefs = [].concat(_.get(element, 'xref', []));
    let dbIds = {};

    xrefs.forEach( xref => {
      if( rawMap.has( xref ) ){
        let { db, id } = rawMap.get( xref );

        if( db != null && id != null ){
          // e.g.  { 'uniprot': 'Q00987', originalUrl: 'http://identifiers.org/uniprot/Q00987' }
          if( _.has(dbIds, db) ){
            dbIds[db] = dbIds[db].concat(id);
          } else {
            dbIds[db] = [id];
          }
        }
      }
    });

    xRefMap.set(xRefElementId, { dbIds } );
  });

  biopaxElementGraph.forEach( element => {
    let entityReference = _.get(element, 'entityReference', null);
    let elementId = _.get(element, '@id');
    let dbIds = [];

    if( entityReference != null ){
      dbIds = xRefMap.get( entityReference );
    }
    elementMap.set( elementId, _.assign( element, { dbIds } ) );
  });

  return elementMap;
};


let populateMetadata = ( cyJsonNodes, biopaxJsonText ) => {
  let bm = biopaxText2ElementMap( biopaxJsonText );
  let cyJsonNodeMetadataMap = {};

  cyJsonNodes.forEach( node => {
    let nodeId = node.data.id;
    let altPCId = nodeId.substring(0, nodeId.lastIndexOf('_'));

    // weird legacy hack to get extra metadata for certain nodes that have PC prefixes
    if( bm.has( nodeId ) ){
      cyJsonNodeMetadataMap[nodeId] = extractBiopaxMetadata( bm.get(nodeId) );
    } else {
      if( bm.has( altPCId ) ){
        cyJsonNodeMetadataMap[nodeId] = extractBiopaxMetadata( bm.get(altPCId) );
      }
    }
  });

  return cyJsonNodeMetadataMap;
};

module.exports = { populateMetadata };