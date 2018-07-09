const fs = require('fs');
const metadataParser = require('./metadataParserJson');
const _ = require('lodash');
const config = require('../../../config');

//map keys are rdfIDs (PC xml:base prefix is removed) or standard (absolute) URIs
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
function buildBioPaxTree(entity) {
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
    let keyName = 'Reference';
    if (i == (xrefList.length - 1) && eref)
      keyName = 'EntityReference';

    //Get Referenced element and make sure it's valid
    let refElement = getBiopaxElement(xrefList[i]);
    if (!(refElement))
      continue;

    //create list of xrefs for eref
    if(keyName === "EntityReference"){
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
    let refElement = getBiopaxElement(erefXrefList[i]);
    if (!(refElement))
      continue;

    collectedData.push([keyName,collectEntityMetadata(refElement,keyName)]);
  }

}

/**
 * Gets element from the biopax JSON-LD map.
 *
 * @param {*} id String representing potential BioPAX rdf:ID (without xml:base prefix)
 * or absolute URI (for identifiers.org type URIs)
 * @returns BioPAX metadata for that ID (if it exists) or null (if it doesn't)
 */
function getBiopaxElement(id) {
  //make sure id isn't empty string or null
  if(id)
    return biopaxMap.get(id);
  else {
    return null;
  }
}

/**
 * Builds a localId-to-biopaxElement map from a biopax JSON-LD model.
 * @param {*} biopaxJsonText String - BioPAX sub-network in JSON-LD format
 * @returns `Map` containing BioPAX network metadata
 */
function getBiopaxMap(biopaxJsonText) {
  //parse String into JSON object, rename '@id' property to 'pathid'
  const graph = JSON.parse(biopaxJsonText.replace(new RegExp('@id', 'g'), 'pathid'))['@graph'];
  const biopaxMap = new Map();
  //The 'pathid' property contains absolute URI (URL format by design);
  //here we extract only localID part to make it the key for the map:
  for (const element of graph) {
    const fullId = element['pathid'];
    const subId = fullId.substring(config.PC_XMLBASE.length);
    biopaxMap.set(subId, element);
  }

  return biopaxMap;
}

/**
 * Normalize node/edge (originated from the SBGN model) ids
 * if needed.
 * @param cyId
 */
function trimXmlBaseFromNodeId(cyId) {
  const prefix = config.PC_XMLBASE.replace(/[^-\w]/g,"_"); //same as Paxtools/sbgn-converter (java) does
  if(cyId.includes(prefix))
    return cyId.replace(new RegExp(prefix,'g'),'');
  else
    return cyId;
}

const getGenericPhysicalEntityMap = _.memoize(() => JSON.parse(
  fs.readFileSync(__dirname + '/generic-physical-entity-map.json', 'utf-8')
));


/**
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
    //remove xml:base if any (depends on Paxtools/sbgn-converter version of the PC server)
    let xmlid = trimXmlBaseFromNodeId(node.data.id);
    //get by local part rdf:ID (e.g., by "Complex_3177c97899ae28fcb27056b4ccbfcbbb" w/o xml:base)
    let bpe = getBiopaxElement(xmlid);
    if (!bpe) {
      //remove the last underscore and everything after it and search again
      //(generics' or complex components' xml ids look like: Protein_4c4358ebaabf0f39e1e5325a4178d931_830703244edf74707f84842e080f965d)
      xmlid = xmlid.substring(0, xmlid.lastIndexOf("_"));
      //Search for ID in the first 2 underscores
      bpe = getBiopaxElement(xmlid);
    }
    //build the tree for metadata and add it to the map
    nodeMetadataMap[node.data.id] = metadataParser(buildBioPaxTree(bpe));
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
    let xmlId = trimXmlBaseFromNodeId(node.data.id);
    let syns = _.get(genericPhysicalEntityMap[config.PC_XMLBASE + xmlId], 'synonyms', []);
    if(!syns || syns.length==0) { //can be a complex/generic member id
      xmlId = xmlId.substring(0, xmlId.lastIndexOf("_"));
      syns = _.get(genericPhysicalEntityMap[config.PC_XMLBASE + xmlId], 'synonyms', []);
    }
    nodeGeneSynonyms[node.data.id] = syns;
  });

  return nodeGeneSynonyms;
};


module.exports = {getBiopaxMetadata, getGeneSymbolsForGenericNodes};