const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const sanitize = require("sanitize-filename");

const logger = require('../../../logger');
const stat = Promise.promisify(fs.stat);
const { writeArchiveFiles } = require('../../../source-files');
const { GMT_ARCHIVE_URL, DOWNLOADS_FOLDER_NAME } = require('../../../../config.js');
const ROOT_FOLDER_PATH = path.resolve( __dirname, '../../../../../' );
const DOWNLOADS_FOLDER_PATH = path.resolve( ROOT_FOLDER_PATH, DOWNLOADS_FOLDER_NAME );

const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];

let fpaths = null;
let mtime = null;

const lastModTime = t => {
  if( !t ){
    return mtime;
  } else {
    mtime = t;
  }
};

const sourceFilePaths = p => {
  if( !p ){
    return fpaths;
  } else {
    fpaths = p;
  }
};

const updateEnrichment = async () => {
  try {
    // If exists in DOWNLOADS_FOLDER_PATH
    const sanitized_filenames = GMT_ARCHIVE_FILENAMES.map( sanitize );
    const fileStats = await stat( path.resolve( DOWNLOADS_FOLDER_PATH, _.head( sanitized_filenames ) ) );
    sourceFilePaths( sanitized_filenames.map( fname => path.resolve( DOWNLOADS_FOLDER_PATH, fname ) ) );
    lastModTime( fileStats.mtimeMs );

  } catch (e) {
    // Populate source files
    sourceFilePaths( await writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES ) );
    const fileStats = await stat( _.head( sourceFilePaths() ) );
    lastModTime( fileStats.mtimeMs );

  } finally {
    logger.info(`Enrichment data updated`);
  }
};

module.exports = { updateEnrichment, lastModTime, sourceFilePaths };