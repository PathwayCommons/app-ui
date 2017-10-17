/**
    Pathway Commons Central Data Cache

    Tree Traversal
    treeTraversal.js

    Purpose  : To provide functions to search and traverse a tree represented using 
               javascript arrays

    Requires : Valid tree array

    @author Harsh Mistry
    @version 1.1 2017/10/17
**/

//Returns all values mapped to a key in a given subtree
//Requires subtree to be valid
//Note : - A empty array is returned if no match is found
//       - Recurse indicates if other levels of the tree should be searched
function searchTree(subtree, key, recurse = true) {
    var result = []
  
    //Loop through all level nodes
    for (var i = 0; i < subtree.length; i++) {
      //Push current value if it matches
      if (subtree[i][0] == key) {
        result.push(subtree[i][1]);
      }
  
      //Recurse on subtree if one exists
      if (subtree[i][1] instanceof Array && recurse) {
        result.push(searchTree(subtree[i][1], key));
      }
    }
  
    //Remove all invalid values
    for (var i = 0; i < result.length; i++) {
      if (!(result[i])) {
        result.splice(i, 1);
      }
    }
  
    return result;
  }
  
  //Search for just one entry
  //Requires a valid subtree
  //Note : Recurse will search entire subtree for the node
  function searchOne(subtree, key, name) {
    var temp = searchTree(subtree, key, false);
    if (temp.length > 0) return name + temp[0];
    else return null;
  }
  
  //Search for multiple entries
  //Requires a valid subtree
  function searchMultiple(subtree, key, name) {
    var temp = searchTree(subtree, key, false);
    if (temp && temp.length > 0) return [name, temp];
    else return null;
  }
  
  
  //Search for a subnode
  //Returns an array, a string, or null
  //Requires a valid subtree
  function searchForNode(subtree, key) {
    if (!(subtree)) return null;
    for (var i = 0; i < subtree.length; i++) {
      if (subtree[i][0].indexOf(key) !== -1) return subtree[i][1];
    }
    return null;
  }
  
  //Search for first instance of a key in a subtree
  //Returns a string or array
  //Requires valid subtree
  function searchForFirst(subTree, key) {
    if (!(subTree)) return null;
  
    //Loop through all nodes
    for (var i = 0; i < subTree.length; i++) {
      if (subTree[i][0].indexOf(key) > -1) {
        return subTree[i][1];
      }
      else if (subTree[i][1] instanceof Array) {
        var result = searchForFirst(subTree[i][1], key);
        if (result) return result;
      }
    }
  
    //No Match
    return null;
  }
  
  //Search for a subnode based on an exact match
  //Returns an array, a string, or null
  //Requires a valid subtree
  function searchForExactNode(subtree, key) {
    if (!(subtree)) return null;
    for (var i = 0; i < subtree.length; i++) {
      if (subtree[i][0] === key) return subtree[i][1];
    }
    return null;
  }

  module.exports = {
      searchForExactNode : searchForExactNode,
      searchForFirst : searchForFirst,
      searchForNode: searchForNode,
      searchMultiple: searchMultiple,
      searchOne: searchOne,
      searchTree : searchTree
  }