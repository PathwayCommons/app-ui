const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const { fetch } = require('../../../../util');
const logger = require('../../../logger');
const { GPROFILER_URL } = require('../../../../config');

const GMT_ZIP_FILENAME = 'gprofiler_hsapiens.NAME.gmt.zip';
const GMT_URL =  GPROFILER_URL + 'gmt/' + GMT_ZIP_FILENAME;
const GMT_FILENAME = 'hsapiens.pathways.NAME.gmt';
// const GMT_URL = 'http://techslides.com/demos/samples/sample.zip';
// const GMT_FILENAME = 'apple-touch-icon-57-precomposed.png';

const extractGmtArchive = readableStream => readableStream.pipe( unzipper.Parse() );
const fetchPathwayGmtArchive = url => fetch( url ).then( res => res.body );

const getWritableStream = ( pathString, fileName ) => fs.createWriteStream( path.resolve( pathString, 'output', fileName ) );

const getGmtFile = ( readableStream, targetFile ) => {
  readableStream.on('entry', entry =>
    entry.path === targetFile ? entry.pipe( getWritableStream( __dirname, targetFile ) ) : entry.autodrain()
  );
};

const getPathwayGmt = ( url, targetFile ) => {
  fetchPathwayGmtArchive( url )
    .then( extractGmtArchive )
    .then( readableStream => getGmtFile(readableStream, targetFile) );
};

const updateEnrichmentGmt = () => {
  logger.info('Triggered cron job');
  getPathwayGmt( GMT_URL, GMT_FILENAME );
};

module.exports = { updateEnrichmentGmt };

