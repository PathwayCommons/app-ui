const request = require('request');
const unzipper = require('unzipper');
const sanitize = require("sanitize-filename");
const logger = require('../../../logger');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');

const { handleFileUpdate
  , GMT_ARCHIVE_FILENAMES
 } = require('./pathway-table');

const SANITIZED_GMT_ARCHIVE_FILENAMES = GMT_ARCHIVE_FILENAMES.map( sanitize );
const fetchZipCDFiles = url => unzipper.Open.url( request, url ).then( cd => cd.files );
const pickFiles = files => files.filter( d => SANITIZED_GMT_ARCHIVE_FILENAMES.indexOf( sanitize( d.path ) ) > -1 );
const updateGmt = url => {
  fetchZipCDFiles( url )
    .then( pickFiles )
    .then( handleFileUpdate )
    .then( () => logger.info(`Enrichment: Updated GMT from ${url}`) )
    .catch( error => logger.error(`Enrichment: Failed to update GMT from ${url} - ${error}`) );
};

const updateEnrichment = () => {
  updateGmt( GMT_ARCHIVE_URL );
};

module.exports = { updateEnrichment };