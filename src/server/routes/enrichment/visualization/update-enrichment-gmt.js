const fs = require('fs');
const path = require('path');
const unzip = require('unzip');

const { fetch } = require('../../../../util');
const logger = require('../../../logger');
const { GPROFILER_URL } = require('../../../../config');

const GMT_ZIP_FILENAME = 'gprofiler_hsapiens.NAME.gmt.zip';
const GMT_URL = GPROFILER_URL + 'gmt/' + GMT_ZIP_FILENAME;
const GMT_OUTPUT_FILE = 'hsapiens.pathways.NAME.gmt';

const unzipArchive = () => unzip.Parse();

const getPathwayGmt = targetFile => {
  return fetch( GMT_URL )
    .pipe( unzipArchive )
    .on('entry', entry => {
      var fileName = entry.path;
      if ( fileName === targetFile ) {
        console.log( `entry.path - ${JSON.stringify(entry, null, 2)}`);
        // entry.pipe(fs.createWriteStream('output/path'));
      } else {
        entry.autodrain();
      }
    });
};

const updateEnrichmentGmt = () => {
  logger.info('Triggered cron job');
  getPathwayGmt( GMT_OUTPUT_FILE );
};

module.exports = { updateEnrichmentGmt };

