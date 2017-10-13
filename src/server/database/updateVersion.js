/**
    Pathway Commons Central Data Cache

    Pathway Commons Database Population
    updateVersion.js

    Purpose : Adds the data to an existing database (created by buildDB.js)
    based on a directory of pathway commons with minimal data duplication

    Requires : A running rethinkdb connection and a directory of sbgn files
    as grabbed from the pathway commons web service.

    Effects : Creates graph and version entries in the database.

    Note : Currently broken due to direct comparisons of graph objects 
    causing a heap overflow.

    TODO: 
    - consider merging this file with createDatabase.js (which populates an empty database)


    @author Geoff Elder
    @version 1.1 2017/10/10
**/

// TO DO:
// Link this to populateDB.js file xml file reading 

process.on('unhandledRejection', up => { throw up; }); // fail loudly. Enforces good promise handling

const r = require('rethinkdb');

const dbName = 'layouts'; // easily allow testing on a fake database once the system is in use

function connect(){
  return r.connect( {host: 'localhost', port: 28015});
}

function insert(table, data, connection, callback) {
  return r.db(dbName).table(table).insert(data).run(connection, callback);
}

function createVersion(version, connection,callback){
  return insert('version',{version:version},connection,callback);
}

/* updateVersion(version,uris, data,connection,callback) creates the framework
 for a new version of pathway commons to be saved efficiently to the database.
  It expects data to be a list of cytoscape objects, uris to be a list of 
  uris and version to be a simple version number.
 */
function updateVersion(version, uris, data, connection, callback) {
  //Create a new version entry
  var update = insert('version', { version: version }, connection)
    .then((result) => {
      //then iterate through each new data set and create the necessary tables.
      var versionId = result.generated_keys[0];
      for (var i = 0; i < uris.length; i++) {
        updateVersionEntry(uris[i], data[i], versionId, connection);
      }
    }).catch((e) => {
      throw e;
    });

  // call the callback or return a promise.
  if (callback) {
    update.then(callback());
  } else {
    return update;
  }
}

/* updateVersionEntry(uri, data,versionId, connection [,callback])
  updates the database for a specific uri for a new PC version.
  It creates uri and graph rows if needed and create pivot rows to connect
  the new data. It either calls the callback on completion or returns a 
  promise.
*/
function updateVersionEntry(uri, data, versionId, connection, callback) {

  // Does this uri exist?
  var existingUri = r.db(dbName)
    .table('uri')
    .filter({ uri: uri })
    .limit(1)
    .run(connection);

  // Does this graph exist in the database already?
  // currently a hard check. Should consider if this is intelligent!
  var existingData = r.db(dbName)
    .table('graph')
    .filter(function(graph){
      return graph === data;
    })
    .limit(1)
    .run(connection);

  var update = Promise.all([existingUri, existingData])
    .then((result) => {
      // Stuff here doesn't print

      Promise.all([result[0].toArray(), result[1].toArray()])
        .then(([uriList, dataList]) => {
          // Create a list of ids for existing data for this graph and this version

          // If both already exist, check if they were linked in previous versions.
          // If they were, all that need to be done is link the version into the existing network
          // Otherwise, create a new uriTranslation to show the new linking
          if (uriList.length && dataList.length) {
            // check if the point to the same place
            return r.db(dbName)
              .table('uriTranslation')
              .filter({ uri_id: uriList[0].id })
              .filter({ graph_id: dataList[0].id })
              .count()
              .run(connection)
              .then((result) => {
                // result is the number of translation pivots that point to both the graph and the uri
                // should only ever be 0 or 1.
                if (!result) { // If it's 0 then this is a new linkage
                  return Promise.all([
                    insert('uriTranslation', { uri_id: uriList[0].id, graph_id: dataList[0].id }, connection),
                    insert('versionTranslation', { version_id: versionId, graph_id: dataList[0].id }, connection)
                  ]);
                } else { // If it is one then it is a preexisting one.
                  return insert('versionTranslation', { version_id: versionId, graph_id: dataList[0].id }, connection);
                }
              }).catch((e) => {
                throw e;
              });

            // If the uri existed before but now points to a new graph
            // Create the new graph then link everything together/
          } else if (uriList.length) {
            return insert('graph', { graph: data }, connection)
              .then((result) => {
                return Promise.all([
                  insert('uriTranslation', { uri_id: uriList[0].id, graph_id: result.generated_keys[0] }, connection),
                  insert('versionTranslation', { version_id: versionId, graph_id: result.generated_keys[0] }, connection)
                ]);
              }).catch((e) => {
                throw e;
              });

            // If only the graph existed before (new uri for old graph),
            // create the new uri and link everything together
          } else if (dataList.length) {
            return insert('uri', { uri: uri }, connection)
              .then((result) => {
                return Promise.all([
                  insert('uriTranslation', { uri_id: result.generated_keys[0], graph_id: dataList[0].id }, connection),
                  insert('versionTranslation', { version_id: versionId, graph_id: dataList[0].id }, connection)
                ]);
              }).catch((e) => {
                throw e;
              });

            // If none of the data existed before: create and link everything.
          } else {
            var graphProm = insert('graph', { graph: data }, connection);
            var uriProm = insert('uri', { uri: uri }, connection);

            return Promise.all([graphProm, uriProm])
              .then(([gResult, uResult]) => {
                return Promise.all([
                  insert('uriTranslation', { uri_id: uResult.generated_keys[0], graph_id: gResult.generated_keys[0] }, connection),
                  insert('versionTranslation', { version_id: versionId, graph_id: gResult.generated_keys[0] }, connection)
                ]);
              }).catch((e) => {
                throw e;
              });
          }
        }).catch((e) => {
          throw e;
        });
    }).catch((e) => {
      throw e;
    });

  // Return or callback depending on the input
  if (callback) {
    update.then(callback())
      .catch((e) => {
        throw e;
      });
  } else {
    return update;
  }
}

module.exports = {
  createVersion: createVersion,
  updateVersion: updateVersion,
  updateVersionEntry: updateVersionEntry,
  connect: connect
};
