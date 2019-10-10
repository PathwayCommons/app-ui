const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');

const logger = require('../../../logger');
const stat = Promise.promisify(fs.stat);
const { writeArchiveFiles } = require('../../../source-files');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');

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
    fpaths = await writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES );
    const fileStats = await stat( _.head( fpaths ) );
    lastModTime( fileStats.mtimeMs );
  } catch (e) {
    logger.error( `A problem was encountered: ${e}` );
    throw e;
  }
};

module.exports = { updateEnrichment, lastModTime, sourceFilePaths };