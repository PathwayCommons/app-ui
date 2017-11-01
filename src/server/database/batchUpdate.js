const fs = require('fs'); // node file system, to be used for importing XMLs
const query = require('./query');
const update = require('./update');
const Promise = require('bluebird'); // used in old file process code
let Multispinner = require('multispinner');
const _ = require('lodash');

const cyJson = require('./../graph-generation/cytoscapeJson');

const args = process.argv;

const version = args[2];
const dir = args[3] ? args[3] : './';

if (!version) throw Error('no version provided');

function readURINames(dir) {
  let text = fs.readFileSync(dir + '/pathways.txt', { encoding: 'utf-8' });

  let matches = text.match(/^(\S)+/mg); // Slice ignores file header
  matches = Array.from(new Set(matches)); // Remove duplication

  return matches.slice(1); // Remove the header from the table.

}



// // Errors from cyJson.getCytoscapeJson will be an object with exactly one
// // key, called error, with value of a string containing a description of the error
// // e.g. {error: "errormsg"}
// function processFile(pc_id, release_id, method, connection) {
//   // will eventually need to change method each time in getCytoscapeJson
//   return 
// }

let connectionPromise = query.connect();

// After connection is received, try to get stuff from Harsh's cyJSON script
// and use the results to update the DB. For each URL, three methods are tried
// from fastest to slowest until one works, or they all fail.
connectionPromise.then(connection => {
  if (!connection) throw new Error('No database connection');

  // Get URIs from the optionally specified file (or from the current dir if none)
  let finishedPathways = fs.readdirSync(dir).indexOf('finishedPathways.txt') !== -1;

  let doneFiles = finishedPathways ?
    fs.readFileSync('./finishedPathways.txt', { encoding: 'utf-8' }).toString().split('\n')
    : [];
  let fileList = _.difference(readURINames(dir), doneFiles);
  // fileList = ['http://identifiers.org/smpdb/SMP00109', 'http://identifiers.org/smpdb/SMP00329'];

  let unloadedFiles = [];

  const concurrency = 4;
  const numFiles = fileList.length;
  const method = 'jsonld';

  let counter = 1;

  Promise.map(fileList, file => {
    const spinner = new Multispinner({
      'script': `${Math.floor(counter++)} / ${numFiles}\t\t${file}`
    });

    return cyJson.getCytoscapeJson(file, method).then(data => {
      if (typeof data !== typeof {}) {
        return {error: 'No object received.'};
      } else if (
        Object.keys(data).length === 1 
        && Object.keys(data)[0] === 'error'
      ) {
        spinner.error('script');
        unloadedFiles.push(file);
        return data;
      } else {
        return update.updateGraph(file, version, data, connection).then(() => spinner.success('script'));
      }
    }); 
  }, {concurrency: concurrency}).then(() => console.log('Finished.'));
});