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

let sourceFilePaths = null;
let lastModTime = null;

const lastModTime = t => {
  if( !t ){ 
    return lastModTime 
  } else {
    lastModTime = t;
  }
};

const updateEnrichment = async () => { 
  try {
    sourceFilePaths = await writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES );
    const fileStats = await stat( _.head( sourceFilePaths ) );
    lastModTime( fileStats.mtimeMs );
    return sourceFilePaths;
  } catch (e) { 
    logger.error( `A problem was encountered: ${e}` );
    throw e;
  }
};

module.exports = { updateEnrichment, lastModTime };