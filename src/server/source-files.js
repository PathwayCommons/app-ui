const fs = require('fs');
const request = require('request');
const unzipper = require('unzipper');
const sanitize = require("sanitize-filename");
const MultiStream = require('multistream');

const logger = require('./logger');

const fetchZipCDFiles = url => unzipper.Open.url( request, url ).then( cd => cd.files );
const pickFiles = ( files, filenames ) => files.filter( d => filenames.indexOf( sanitize( d.path ) ) > -1 );
const handleFilesUpdate = ( files, destination ) => { 
  let fileStream, writeStream = fs.createWriteStream( destination );
  if( files.length === 1 ) {
    fileStream = files[0].stream();
  } else {
    fileStream = MultiStream( files.map( f => f.stream() ) );
  }
  fileStream.pipe( writeStream );

  return new Promise( ( resolve, reject ) => {
    writeStream.on( 'close', () => resolve( true ) );
    writeStream.on( 'error', () => reject( false ) );
  });
};

/**
 * writeArchiveFiles
 * 
 * Download files in a compressed archive and write to a single destination file
 * @param { string } url The url pointing to the compressed archive
 * @param { array } filenames An array of filenames within the archive
 * @param { string } destination The host file path to write data to
 * @returns { boolean } True if NodeJS fs writeStream 'close' fired; else false on 'error'
 */
const writeArchiveFiles = ( url, filenames, destination ) => {
  const safeFilenames = filenames.map( sanitize );
  return fetchZipCDFiles( url )
    .then( files => pickFiles( files, safeFilenames ) )
    .then( files => handleFilesUpdate( files, destination ) )
    .catch( error => {
      logger.error(`Fetched archive files: Failed fetch at ${url} - ${error.message}`);
      throw error;
    });
};

module.exports = { writeArchiveFiles }; 