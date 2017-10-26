
const fs = require('fs'); // node file system, to be used for importing XMLs
const accessDB = require('./query');
// const Promise = require('bluebird'); // used in old file process code
var Multispinner = require('multispinner');

const whilst = require('async/whilst');
const cyJson = require('./../graph-generation/cytoscapeJson');

const args = process.argv;

const version = args[2];
const dir = args[3] ? args[3] : './';

if (!version) throw Error('no version provided');

function readURINames(dir) {
  var text = fs.readFileSync(dir + '/pathways.txt', { encoding: 'utf-8' });

  var matches = text.match(/^(\S)+/mg); // Slice ignores file header
  matches = Array.from(new Set(matches)); // Remove duplication

  return matches.slice(1); // Remove the header from the table.

}

// Errors from cyJson.getCytoscapeJson will be an object with exactly one
// key, called error, with value of a string containing a description of the error
// e.g. {error: "errormsg"}
function processFile(pc_id, release_id, method, connection) {
  // will eventually need to change method each time in getCytoscapeJson
  return cyJson.getCytoscapeJson(pc_id, method)
    .then(data => {
      if (typeof data !== typeof {}) {
        return {error: 'No object received.'};
      } else if (
        Object.keys(data).length === 1 
        && Object.keys(data)[0] === 'error'
      ) {
        return data;
      } else {
      return accessDB.updateGraph(pc_id, release_id, data, connection);
      }
    });
}

var connectionPromise = accessDB.connect();

// After connection is received, try to get stuff from Harsh's cyJSON script
// and use the results to update the DB. For each URL, three methods are tried
// from fastest to slowest until one works, or they all fail.
connectionPromise.then(connection => {
  accessDB.setDatabase('metadataTest', connection).then(() => {
    if (!connection) throw new Error('No database connection');

    // the getCytoscapeJson script can use one of three different methods to fetch
    // data. the fastest uses JSON, a slower method uses xml biopax data, and the
    // (by far) slowest uses PC2 directly. The exact names of the methods used there
    // should go here.
    const methods=['jsonld', 'biopax', 'pc2'];

    // Get URIs from the optionally specified file (or from the current dir if none),
    // and give them a starting attempt of 1.
    var fileList = readURINames(dir).map(uri => {
      return [1, uri];
    });

    const originalLength = fileList.length;

    // To be populated with URIs that don't work with any of the methods
    var unreadURIs = [];

    // Asyncronous while loop
    whilst(
      // Stop looping only when the fileList is completely empty.
      function() { return fileList.length > 0; },
      function(callback) {
        // The current one of interest is always stored at the front of the array.
        // The fileList is basically used as a queue
        const attempt = fileList[0][0];
        const uri = fileList[0][1];

        const spinner = new Multispinner({
          'script': `Attempt ${attempt} of uri ${uri} \t\t ${originalLength-fileList.length+1} / ${originalLength}`
        });

        processFile(uri, version, methods[attempt - 1], connection).then(res => {
          // Identify the very specific structure of an error sent from cytoscapeJSON.js
          // e.g. {error: 'errormsg'}
          // It is assumed that processFile always returns an object for now
          if (
            Object.keys(res).length === 1 
            && Object.keys(res)[0] === 'error'
          ) {
            // The offender is at the front of the array so take it out and store it
            var offender = fileList.shift();
            if (attempt > methods.length) {
              // If we've tried everything, give up and permanently remove the offender
              // from fileList, storing it in a garbage array
              unreadURIs.push(uri);
            } else {
              // If we haven't gone through all the methods yet, increase the offender's
              // attempt number and put it at the back of the queue.
              offender[0]++;
              fileList.push(offender);
            }
            spinner.error('script');
            console.log('Failed on attempt '+attempt);
            callback(null, unreadURIs); // prepare callback function 
          } else {
            fileList.shift(); // if all is well, remove from fileList and move on
            spinner.success('script');
            callback(null, unreadURIs); // prepare callback function 
          }
        });
      },
      function(err, unreadURIs) {
        if (err) {
          console.log(err);
          return;
        }

        console.log(unreadURIs);
      }
    );

    // Old code that uses map to run many asynchronous calls at once
    // but does not deal with errors

    // Promise.map(fileList, file => {
    //   return processFile(file, version, connection);
    // },
    //   { concurrency: 4 });
  });

}).catch((e) => {
  throw e;
});



