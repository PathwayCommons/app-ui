/**
    Pathway Commons Central Data Cache

    Pathway Commons Database Population
    createDatabase.js

    Purpose : Adds the data to an existing empty database (created by buildDB.js)
    based on a directory of pathway commons 

    Requires : A running rethinkdb connection and a directory of sbgn files
    as grabbed from the pathway commons web service.

    Effects : Creates graph and version entries in the database.

    Note : None

    TODO: 
    - consider merging this file with updateVersiion.js (which populates a non empty)


    @author Geoff Elder
    @version 1.1 2017/10/10
**/


const fs = require('fs'); // node file system, to be used for importing XMLs
const convert = require('sbgnml-to-cytoscape'); // used to convert to cy JSONs
const accessDB = require('./accessDB.js');
const Promise = require('bluebird');
const checksum = require('checksum');
const cyJson = require('./../graph-generation/cytoscapeJson');

const args = process.argv;

const version = args[2];
const dir = args[3] ? args[3] : './';

if (!version) throw Error('no version provided');


// Takes in a uri-to-be with and checks if it has the form
// 'http___stuff_morestuff_otherstuff'
function validateURI(uri) {
  return uri.slice(-4) === '.xml' || /^http_{3}/.test(uri);
}


// Takes in a uri-to-be with the form http___stuff_morestuff_otherstuff
// and replace all underscores with the URI characted for "/", except those
// three underscores following http
function URIify(str) {
  var str_change = str.replace(/\s/g, ''); // eliminate whitespace
  str_change = str_change.replace(/^(http)_{3}/, 'http://'); // replace http___ with uri encoded http://
  str_change = str_change.replace(/_/g, '/'); // replace rest of underscores with slashes
  str_change = str_change.slice(0, -4); // get rid of .xml extension
  return str_change;
}

function readURINames(dir) {
  var text = fs.readFileSync(dir + '/pathways.txt', { encoding: 'utf-8' });

  var matches = text.match(/^(\S)+/mg); // Slice ignores file header
  matches = Array.from(new Set(matches)); // Remove duplication

  return matches.slice(1); // Remove the header from the table.

}


var connectionPromise = accessDB.connect();


function processFile(pc_id, release_id, connection) {
  return cyJson.getCytoscapeJson(pc_id)
    .then((data) => {
      return accessDB.updateGraph(pc_id, release_id, data, connection);
    }).catch((e)=>{
      throw e;
    });
}


connectionPromise.then((connection) => {
  accessDB.setDatabase('testLayouts', connection).then(() => {
    if (!connection) throw new Error('No database connection');

    var fileList = readURINames(dir);

    Promise.map(fileList, function (file) {
      return processFile(file, version, connection);
    },
      { concurrency: 4 });
  });

}).catch((e) => {
  throw e;
});



