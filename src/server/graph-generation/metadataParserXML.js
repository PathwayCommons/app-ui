const treeTraversal = require('./treeTraversal.js');

//Parse database ids
//Requires a subtree consisting of database ID objects
//Note : null is returnd if no ID is found.
function parseDatabaseIDs(subTree) {
  var result = [];

  //Loop through all different database ids
  for (var i = 0; i < subTree.length; i++) {
    //Get values
    //console.log(subTree[i]);
    var id = treeTraversal.searchForExactNode(subTree[i], 'bp:id');
    var source = treeTraversal.searchForExactNode(subTree[i], 'bp:db');

    //Push to result
    if (id && source) result.push([source, id]);
  }

  return result;
}

//x.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-\[\]\(\)\\=#$]{6,})$/ig)

//Returns a human readable array of metadata
//Requires subtree to be valid
//Note : null is returned if nothing can be parsed
function parse(subTree) {
  var result = [];
  var temp = [];
  var databaseIDs = [];

  //Stop id subtree is invalid
  if (!(subTree)) return null;

  //Get the entity reference object
  var eRef = treeTraversal.searchForExactNode(subTree, 'bp:entityReference');

  if (eRef) {
    //Get the standard name
    result.push(treeTraversal.searchOne(eRef, 'bp:standardName', 'Standard Name'));

    //Get names
    result.push(treeTraversal.searchMultiple(eRef, 'bp:name', 'Names'));

    //Get database ids
    databaseIDs = treeTraversal.searchMultiple(eRef, 'bp:xref', 'Database IDs')
    if (databaseIDs) databaseIDs = databaseIDs[1];
  }

  //Get data source
  var source = treeTraversal.searchForNode(subTree, 'bp:dataSource');
  if (typeof source === 'string') result.push(['Data Source', source]);
  else if (source) result.push(['Data Source', treeTraversal.searchForNode(source, '')]);

  //Get values if entity reference was not found
  if (!eRef) {
    //Get BioPax Names
    result.push(treeTraversal.searchMultiple(subTree, 'bp:name', 'Names'));

    //Get Biopax database id's
    databaseIDs = [treeTraversal.searchForNode(subTree, 'bp:xref')];
  }

  //Get cellular location
  var location = treeTraversal.searchForNode(subTree, 'bp:cellularLocation');
  if (location) {
    //var term = searchForNode(location, 'bp:term');
    var term = treeTraversal.searchForFirst(location, 'bp:term');
    if (term) result.push(['Cellular Location', term]);
  }

  //Get all comments
  result.push(treeTraversal.searchMultiple(subTree, 'bp:comment', 'Comment'));

  //Get display name
  temp = treeTraversal.searchForNode(subTree, 'bp:displayName');
  if (temp) result.push(['Display Name', temp]);

  //Get any inObject database ids
  var noRefId = treeTraversal.searchForExactNode(subTree, 'bp:id');
  var noRefDb = treeTraversal.searchForExactNode(subTree, 'bp:db');

  //Parse database id objects
  if (databaseIDs) databaseIDs = parseDatabaseIDs(databaseIDs);
  if (noRefId && noRefDb) databaseIDs.push([noRefDb, noRefId]);
  if (databaseIDs && databaseIDs.length > 0) result.push(['Database IDs', databaseIDs]);

  //Remove all invalid values
  for (var i = result.length - 1; i >= 0; i--) {
    if (!(result[i])) {
      result.splice(i, 1);
    }
  }

  return result;
}

//Export main function
module.exports = parse;

