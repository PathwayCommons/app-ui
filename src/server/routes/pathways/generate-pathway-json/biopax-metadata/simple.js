const _ = require('lodash');

let extractBiopaxMetadata = biopaxJsonEntry => {
  let type = _.get(biopaxJsonEntry, '@type', '');
  let datasource = _.get(biopaxJsonEntry, 'dataSource', '');
  let displayName = _.get(biopaxJsonEntry, 'displayName', '');
  let synonyms = _.get(biopaxJsonEntry, 'name', []);
  let standardName = _.get(biopaxJsonEntry, 'standardName', '');
  let db = _.get(biopaxJsonEntry, 'db', null);
  let er = _.get(biopaxJsonEntry, 'entityReference', null);

  return {
    synonyms,
    datasource,
    type: type.contains(':') ? type.split(':')[1] : type,
    standardName,
    displayName,
    pubmedIds: [],
    databaseIds: [db, er].filter( el => el !== null )
  };
};

let biopaxMap = biopaxJsonText => {
  let m = new Map();

  JSON.parse(biopaxJsonText)['@graph'].forEach( element => {
    let uri = element['@id'];

    m.set(uri, element);
  });

  return m;
};


let populateMetadata = ( cyJsonNodes, biopaxJsonText ) => {
  let bm = biopaxMap( biopaxJsonText );
  let cyJsonNodeMetadataMap = {};

  cyJsonNodes.forEach( node => {
    let nodeId = node.data.id;
    let altPCId = nodeId.substring(0, nodeId.lastIndexOf('_')); // weird legacy hack to get extra metadata for certain nodes that have PC prefixes

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