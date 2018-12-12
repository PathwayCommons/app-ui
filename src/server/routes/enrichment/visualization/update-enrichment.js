const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const { fetch } = require('../../../../util');
const logger = require('../../../logger');
const { GPROFILER_URL } = require('../../../../config');

// const GMT_ZIP_FILENAME = 'gprofiler_hsapiens.NAME.gmt.zip';
// const GMT_URL =  GPROFILER_URL + 'gmt/' + GMT_ZIP_FILENAME;
// const GMT_FILENAME = 'hsapiens.pathways.NAME.gmt';
const GMT_URL = 'http://techslides.com/demos/samples/sample.zip'; // testing (13KB)
const GMT_FILENAME = 'apple-touch-icon-57-precomposed.png'; // testing (2KB)

const fetchDataStream = url => fetch( url ).then( res => res.body );
const extract = readableStream => readableStream.pipe( unzipper.Parse() );

const createOutputStream = pathString => fs.createWriteStream( pathString );

const handleStream = ( inputStream, fileName, outputDirectory = '.' ) => {
  const outputStream = createOutputStream( path.resolve( __dirname, outputDirectory, fileName ) );
  inputStream.on('entry', entry =>  entry.path === fileName ? entry.pipe( outputStream ) : entry.autodrain() );
};

const updateGmt = ( url, fileName ) => {
  fetchDataStream( url )
    .then( extract )
    .then( inputStream => handleStream( inputStream, fileName ) )
    .then( () => logger.info(`Enrichment module updated ${fileName} from ${url}`) )
    .catch( error => logger.error(`Enrichment module error updating ${fileName} from ${url} - ${error}`) );
};

const updateEnrichment = () => {
  updateGmt( GMT_URL, GMT_FILENAME );
};

module.exports = { updateEnrichment };

