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
const update = require('./updateVersion.js');
const accessDB = require('./accessDB.js');
const Promise = require('bluebird');
const checksum = require('checksum');

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

function readURINames(dir){
  var text = fs.readFileSync(dir+ '/pathways.txt',{encoding: 'utf-8'});

  var matches =  text.match(/^(\S)+/mg); // Slice ignores file header
  matches = Array.from(new Set (matches));

  var pathways = matches.slice(1);
  console.log(pathways.length);

  
  pathways = pathways.filter((uri) => {
    var match = uri.match(/_/g);
    return match && match.length >0;
  });
  console.log(pathways.length);

  pathways = pathways.filter((uri) => {
    var match = uri.match(/^((?!Pathway_).)*$/g);
    return match && match.length >0;
  });
  console.log(pathways);


  return; 
} 


var connectionPromise = update.connect();
var conn = null;



function processFile(dir, file) {

  if (!validateURI(file)) {
    return;
  }

  var uri = URIify(file);
  var xml_data = fs.readFileSync(dir + '/' + file);
  var json_data = convert(xml_data);
  var pcID = file.replace(/\s/g,'').slice(0,-4); // Remove .xml extension

  try {
    if (!uri) {
      console.log(file);
    }
    return accessDB.createNew(uri, json_data, version, conn);

  } catch (e) { 
    // Temporary hack until Dylan can address the creation of undefined values
    // in the sbgn-to-cytoscape converter
    json_data = JSON.parse(JSON.stringify(json_data));
    return accessDB.createNew(uri, json_data, version, conn);
  }
}
/*
connectionPromise.then((connection) => {
  conn = connection;
}).catch((e) => {
  throw e;
}).then(() => {
  if (!conn) {
    throw Error('No connection');
  }
  var numProcessed = 0;
  fs.readdir(dir, function (err, files) {
    Promise.map(files, function (file) {

      numProcessed++;
      if (!(numProcessed % 20)) {
        console.log(numProcessed);
      }
      return processFile(dir, file);
    },
      { concurrency: 4 });

  });
});*/

readURINames(dir);
