const fs = require('fs');
const _ = require('lodash');

let extractBiopaxMetadata = biopaxJsonEntry => {
  let databaseIds = _.get(biopaxJsonEntry, 'dbIds', []);
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


  let synonyms = ( 
    _.uniq( 
      _.flatten( [entryNames, entRefNames] ) 
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

        if( db != null && id != null ){
          xRefMap.set(xrefId, { k: db, v: id });
        }
      }
    });
  });

  biopaxElementGraph.forEach( element => {
    let entityReference = _.get(element, 'entityReference', null);
    let xrefIds = [].concat( _.get(element, 'xref', []) );
    let elementId = _.get(element, '@id');
    let dbIds = {};
    let entRefEl = rawMap.get( entityReference );

    if( entRefEl != null ){
      let entRefXrefs = _.get(entRefEl, 'xref', []);
      xrefIds = xrefIds.concat( entRefXrefs );
    }

    // consolidate all the db ids from all the xrefs relevant to this element
    xrefIds.filter( xrefId => xrefId != null ).forEach( xrefId => {
      let { k, v } = xRefMap.get( xrefId );

      if( dbIds[k] != null ){
        dbIds[k] = dbIds[k].concat(v);
      } else {
        dbIds[k] = [v];
      }
    });

    // each 'element' does not contain all of the data we need, it 
    // is scattered across various xref elements and entityReference elements.
    // we merge all this data into one object for easy processing
    elementMap.set( elementId, _.assign( element, { dbIds, entRefEl } ) );
  });

  return elementMap;
};


let getBiopaxMetadata = ( cyJsonNodes, biopaxJsonText ) => {
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


let getGenericPhysicalEntityMap = _.memoize(() => JSON.parse(
  fs.readFileSync(__dirname + '/generic-physical-entity-map.json', 'utf-8')
));



let getGenericPhyiscalEntityData = nodes => {
  let nodeGeneSynonyms = {};
  let genericPhysicalEntityMap = getGenericPhysicalEntityMap();

  nodes.forEach(node => {
    let genericPE = genericPhysicalEntityMap[node.data.id];
    let syns = _.get(genericPE, 'synonyms', []);
    if( syns == null) { syns = []; }
    nodeGeneSynonyms[node.data.id] = syns;
  });

  return nodeGeneSynonyms;
};


module.exports = { getBiopaxMetadata, getGenericPhyiscalEntityData };