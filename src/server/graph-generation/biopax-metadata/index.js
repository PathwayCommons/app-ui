const fs = require('fs');
const metadataParser = require('./metadataParserJson');
const _ = require('lodash');

var biopaxMap = null;

/**
 *
 * @param {*} biopaxElement Metadata for an entity from BioPAX
 * @param {*} nodeType Is this a xref or entity?
 */
function collectEntityMetadata(biopaxElement, nodeType = 'default'){

  let result = [];
  //Collect relevant data on this node, and push it into output
  if (nodeType !== 'Reference') {
    //Get type
    let type = biopaxElement['@type'];
    if (type) { result.push(['Type', type]); }

    //Get data source
    let dataSource = biopaxElement['dataSource'];
    if (dataSource) { result.push(['Data Source', dataSource]); }

    //Get display name
    let dName = biopaxElement['displayName'];
    if (dName) { result.push(['Display Name', dName]); }

    //Get Comments
    let comment = biopaxElement['comment'];
    if (comment) { result.push(['Comment', comment]); }

    //Get Names
    let name = biopaxElement['name'];
    if (name) { result.push(['Names', name]); }

    //Get Standard Name
    let sName = biopaxElement['standardName'];
    if (sName) { result.push(['Standard Name', sName]); }

    //Get Chemical Formula
    let formula = biopaxElement['chemicalFormula'];
    if (formula) { result.push(['Chemical Formula', formula]); }
  }

  //Get database id
  let db = biopaxElement['db'];
  let id = biopaxElement['id'];
  if (db && id) { result.push(['Database ID', [db, id]]); }

  return result;
}

/**
 *
 * @param {*} entity Metadata for an entity in the network
 * @returns Tree array containing all metadata about the given entity
 */
function buildBiopaxTree(entity) {
  let result = [];

  //make sure the metadata exists
  if (!(entity))
    return;

  //Get the node id, as defined in getProcessedBioPax
  let id = entity['pathid'];
  if (!(id)) { id = entity['about']; }
  if (!(id)) { return; }

  //get BioPAX metadata for this node
  let collectedData = collectEntityMetadata(entity);

  //Collect Data for cross-references
  let xrefList = [];
  let xref = entity['xref'];
  let eref = entity['entityReference'];
  if(xref)
    if(typeof xref === 'string')
      xrefList = _.concat(xrefList,[xref]);
    else
      xrefList = _.concat(xrefList,xref);
  if(eref)
    xrefList = _.concat(xrefList,[eref]);

  processXrefs(xrefList,eref,collectedData);

  result.push([id,collectedData]);
  return result;
}

function processXrefs(xrefList,eref,collectedData){
  let erefXrefList = [];

  for (let i = 0; i < xrefList.length; i++) {
    //Check if this is a cross-reference or entity reference
    //(- the last item (if eref is defined) is treated in a special way that
    //TODO: saves a couple of lines but sacrifices clarity...)
    let keyName = 'Reference';
    if (i == (xrefList.length - 1) && eref)
      keyName = 'EntityReference';

    //Get Referenced element and make sure it's valid
    let refElement = getByNodeId(xrefList[i], biopaxMap);
    if (!(refElement)) {
      continue;
    }

    //create list of xrefs for eref
    if(keyName === "EntityReference") {
      let erefXref = refElement['xref'];
      if(erefXref)
        if(typeof erefXref === 'string')
          erefXrefList = _.concat(erefXrefList,[erefXref]);
        else
          erefXrefList = _.concat(erefXrefList,erefXref);
    }

    //Collect data and add to tree array
    collectedData.push([keyName,collectEntityMetadata(refElement,keyName)]);
  }

  //Also collect data for entity reference's cross-references
  //almost identically to above
  for(let i=0;i<erefXrefList.length;i++){
    let keyName = 'Reference';
    let refElement = getByNodeId(erefXrefList[i], biopaxMap);
    if (!(refElement)) {
      continue;
    }

    collectedData.push([keyName,collectEntityMetadata(refElement,keyName)]);
  }

}

/**
 * Gets an object from the given map by biopax URI or Cy node id;
 * node id is mapped onto the biopax URI using several rules
 * (knowing how the SBGN xml ids and CyJson node ids were generated).
 *
 * @param id String representing a BioPAX absolute URI or Cy node id
 * @param  map Map/Object - biopax URI (string) to some objects map (e.g., to elements or metadata)
 * @returns matching value from the Map (if it exists) or null
 */
function getByNodeId(id, map) {
  // shortcut
  if(!id || !map)
    return null;

  let bpe = (map instanceof Map) ? map.get(id) : map[id];
  if (!bpe) {
    //remove the last underscore and everything after, and search again (as generics/complex component ids
    //are sometimes like ..Protein_4c4358ebaabf0f39e1e5325a4178d931_830703244edf74707f84842e080f965d)
    id = id.substring(0, id.lastIndexOf("_"));
    bpe = (map instanceof Map) ? map.get(id) : map[id];
  }

  return (bpe) ? bpe : null;
}

/**
 * Builds a URI-to-biopaxElement map from a biopax JSON-LD model.
 * @param {*} biopaxJsonText String - BioPAX sub-network in JSON-LD format
 * @returns `Map` containing BioPAX JSON objects
 */
function getBiopaxMap(biopaxJsonText) {

  //parse String into JSON object, rename '@id' property to 'pathid'
  const graph = JSON.parse(biopaxJsonText.replace(new RegExp('@id', 'g'), 'pathid'))['@graph'];

  const biopaxMap = new Map();

  //'pathid' is the absolute URI (URL, by design) of a biopax object, and so we use it as map key:
  for (const element of graph) {
    const uri = element['pathid'];
    biopaxMap.set(uri, element);
  }

  return biopaxMap;
}

const getGenericPhysicalEntityMap = _.memoize(() => JSON.parse(
  fs.readFileSync(__dirname + '/generic-physical-entity-map.json', 'utf-8')
));


/**
 * Extracts additional BioPAX properties, for cy nodes,
 * from the corresp. JSON-LD representation
 * (these were missing from the initial SBGN-ML result, converted to CyJson.)
 *
 * @param {*} biopaxJsonText String containing BioPAX metadata for the network
 * @param {*} nodes JSON object containing all the nodes in the network
 * @returns Processed metadata for each node in the network
 */
function getBiopaxMetadata(biopaxJsonText, nodes) {

  //BioPAX metadata comes as a string, turn it into a Map
  biopaxMap = getBiopaxMap(biopaxJsonText);

  const nodeMetadataMap = {};

  //Iterate through nodes in Cy network, adding metadata to each
  nodes.forEach(node => {
    const bpe = getByNodeId(node.data.id, biopaxMap);
    //build the tree for metadata and add it to the map
    nodeMetadataMap[node.data.id] = metadataParser(buildBiopaxTree(bpe));
  });

  return nodeMetadataMap;
}

/**
 *
 * @param nodes
 */
const getGeneSymbolsForGenericNodes = nodes => {
  const nodeGeneSynonyms = {};
  const genericPhysicalEntityMap = getGenericPhysicalEntityMap();

  nodes.forEach(node => {
    const genericPE = getByNodeId(node.data.id, genericPhysicalEntityMap);
    let syns = _.get(genericPE, 'synonyms', []);
    if( syns == null) { syns = []; }
    nodeGeneSynonyms[node.data.id] = syns;
  });

  return nodeGeneSynonyms;
};


module.exports = {getBiopaxMetadata, getGeneSymbolsForGenericNodes};