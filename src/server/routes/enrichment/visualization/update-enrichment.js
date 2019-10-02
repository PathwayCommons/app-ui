const logger = require('../../../logger');
const { fetchArchiveFiles, sanitize } = require('../../../util');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');
const { handleFileUpdate } = require('./pathway-table');

 const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];

const SANITIZED_GMT_ARCHIVE_FILENAMES = GMT_ARCHIVE_FILENAMES.map( sanitize );
const updateGmt = url => {
  fetchArchiveFiles( url, SANITIZED_GMT_ARCHIVE_FILENAMES )
    .then( handleFileUpdate )
    .then( () => logger.info(`Enrichment: Updated GMT from ${url}`) );
};

const updateEnrichment = () => {
  updateGmt( GMT_ARCHIVE_URL );
};

module.exports = { updateEnrichment };