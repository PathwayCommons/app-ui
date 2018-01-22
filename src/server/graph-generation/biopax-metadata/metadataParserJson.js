const treeTraversal = require('./treeTraversal');
const concat = require('unique-concat');

//Parse database ids
//Requires a subtree consisting of database ID objects
//Note : [] is returned if no ID is found.
function parseDatabaseIDs(subTree) {
  let result = [];

  //Loop through all different database ids
  for (let i = 0; i < subTree.length; i++) {
    //Get Reference Child
    let child = subTree[i][1];

    //Search for database id's 
    let dbIdObject = treeTraversal.searchForExactNode(child, 'Database ID');
    if (dbIdObject) result.push(dbIdObject);
  }

  return result;
}

//Parse entity reference
//Requires a valid subtree of a entity reference
//Note : {} is returned if subtree can't be parsed
function parseEntityReference(eref) {
  let result = {};
  let references = [];

  let subtree = eref.slice();

  //Loop over all children
  for (let i = 0; i < subtree.length; i++) {
    if (subtree[i][0] === 'Standard Name') result.sName = subtree[i];
    if (subtree[i][0] === 'Names') result.names = subtree[i];
    if (subtree[i][0] === 'Reference') references.push(subtree[i]);
  }

  if (references) references = parseDatabaseIDs(references);
  if (references) result.references = references;
  if (result.names && typeof result.names[1] !== 'string') result.names = result.names[1];

  return result;
}

//Merge entity reference with Standard Object
//Requires a valid parsed entity reference and object metadata array
function mergeMetadataArrays(entityRef, objectRef) {
  let temp = [];
  //Merge database Ids
  if (entityRef.references) {
    let databaseIds = treeTraversal.searchForExactNodeWithObjectResult(objectRef, 'Database IDs');

    //Determine if arrays should be created or merged
    if (databaseIds) {
      temp = concat(databaseIds.data, entityRef.references);
      objectRef[databaseIds.index][1] = temp;
    }
    else {
      objectRef.push(['Database IDs', entityRef.references]);
    }
  }

  //Merge names
  if (entityRef.names) {
    let names = treeTraversal.searchForExactNodeWithObjectResult(objectRef, 'Names');

    //Determine if arrays should be created or merged
    if (names) {
      //Fix String Array Issue
      if (typeof names.data === 'string') names.data = [names.data];

      temp = concat(names.data, entityRef.names);
      objectRef[names.index][1] = temp;
    }
    else {
      objectRef.push(['Names', entityRef.names]);
    }
  }

   //Merge standard name
   if (entityRef.sName) {
    let sName = treeTraversal.searchForExactNodeWithObjectResult(objectRef, 'Standard Name');

    //Determine if arrays should be created or merged
    if (sName) {
      objectRef[sName.index][1] = entityRef.sName[1];
    }
    else {
      objectRef.push(entityRef.sName);
    }
  }


  return objectRef;
}


//Returns a human readable array of metadata
//Requires subtree to be valid
//Note : null is returned if nothing can be parsed
function parse(subTree) {
  let references = [];

  //Validate subtree
  if (!(subTree)) return null;

  //Make a copy of subtree
  let subTreeCopy = subTree.slice()[0][1];

  //Get Entity Reference
  let entityRef = treeTraversal.searchForExactNodeWithObjectResult(subTreeCopy, 'EntityReference')
  if (entityRef) {
    //Remove un parsed copy
    subTreeCopy.splice(entityRef.index, 1);

    //Parse reference
    entityRef = parseEntityReference(entityRef.data);
  }

  let check= treeTraversal.searchForExactNode(subTreeCopy, 'Names');

  //Get all references
  for (let i = 0; i < subTreeCopy.length; i++) {
    //Get in-object references
    if (subTreeCopy[i][0] === 'Reference') {
      references.push(subTreeCopy[i]);
    }
  }

  //Delete all references and re-index array
  subTreeCopy = subTreeCopy.filter(key => key[0] !== 'Reference');

  //Parse Database ID's
  let parsedIDs = parseDatabaseIDs(references);
  if (parsedIDs) subTreeCopy.push(['Database IDs', parsedIDs]);

  if (entityRef) subTreeCopy = mergeMetadataArrays(entityRef, subTreeCopy);

  return subTreeCopy;
}

//Export main function
module.exports = parse;
