const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const request = require('request');
const unzipper = require('unzipper');

const { fetch } = require('../../../../util');
const logger = require('../../../logger');
const { GPROFILER_URL } = require('../../../../config');

// const GMT_ZIP_FILENAME = 'gprofiler_hsapiens.NAME.gmt.zip';
// const GMT_URL =  GPROFILER_URL + 'gmt/' + GMT_ZIP_FILENAME;
// const GMT_FILENAME = 'hsapiens.pathways.NAME.gmt';
const GMT_URL = 'http://techslides.com/demos/samples/sample.zip'; // testing (13KB)
const GMT_FILENAME = 'apple-touch-icon-57-precomposed.png'; // testing (2KB)

const fetchZipCDFiles = url => unzipper.Open.url( request, url ).then( cd => cd.files );
const pickFile = ( files, fileName  ) => _.head( files.filter( d => d.path === fileName ) );
const handleFile = ( file, fileName ) => {
  const outputStream = fs.createWriteStream( path.resolve( __dirname, '.', fileName ) );
  file.stream().pipe( outputStream );
};

const updateGmt = ( url, fileName ) => {
  fetchZipCDFiles( url )
    .then( files => pickFile( files, fileName ) )
    .then( file => handleFile( file, fileName ) )
    .then( () => logger.info(`Enrichment: Updated ${fileName} from ${url}`) )
    .catch( error => logger.error(`Enrichment: Failed to update ${fileName} from ${url} - ${error}`) );
};

const updateEnrichment = () => {
  updateGmt( GMT_URL, GMT_FILENAME );
};

module.exports = { updateEnrichment };

