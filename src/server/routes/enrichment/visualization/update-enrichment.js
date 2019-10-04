const fs = require('fs');
const path = require('path');
const concat = require('concat');
const Promise = require('bluebird');

const writeFile = Promise.promisify( fs.writeFile );
const { writeArchiveFiles } = require('../../../source-files');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');
const { GMT_SOURCE_FILENAME } = require('../../../../config');

const GMT_SOURCE_PATH = path.resolve(__dirname);

const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];

const updateEnrichment = () => {
  return writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES, GMT_SOURCE_PATH )
    .then( concat )
    .then( data => writeFile( path.resolve( GMT_SOURCE_PATH, GMT_SOURCE_FILENAME ), data ) )
    .then( () => true );
};

module.exports = { updateEnrichment };