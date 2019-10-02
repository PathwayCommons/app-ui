const request = require('request');
const unzipper = require('unzipper');
const sanitize = require("sanitize-filename");
const logger = require('./logger');

const fetchZipCDFiles = url => unzipper.Open.url( request, url ).then( cd => cd.files );
const pickFiles = ( files, filenames ) => files.filter( d => filenames.indexOf( sanitize( d.path ) ) > -1 );

const fetchArchiveFiles = ( url, filenames ) => {
  return fetchZipCDFiles( url )
    .then( files => pickFiles( files, filenames ) )
    .catch( error => {
      logger.error(`Fetched archive files: Failed fetch at ${url} - ${error.message}`);
      throw error;
    });
};

module.exports = { fetchArchiveFiles, sanitize }; 