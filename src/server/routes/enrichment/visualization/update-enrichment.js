const fs = require('fs');
const path = require('path');
const concat = require('concat');
const Promise = require('bluebird');

const writeFile = Promise.promisify( fs.writeFile );
const { writeArchiveFiles } = require('../../../source-files');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');
const { DOWNLOADS_FOLDER_NAME, GMT_SOURCE_FILENAME } = require('../../../../config');

const GMT_SOURCE_PATH = path.resolve(__dirname);
const DOWNLOADS_FOLDER_PATH = path.resolve(__dirname, '../../../../../', DOWNLOADS_FOLDER_NAME);

const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];

const updateEnrichment = () => { console.log(DOWNLOADS_FOLDER_PATH);
  return writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES, DOWNLOADS_FOLDER_PATH )
    .then( concat )
    .then( data => writeFile( path.resolve( GMT_SOURCE_PATH, GMT_SOURCE_FILENAME ), data ) )
    .then( () => true );
};

module.exports = { updateEnrichment };