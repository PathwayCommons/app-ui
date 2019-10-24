const fs = require('fs');
const path = require('path');
const request = require('request');
const unzipper = require('unzipper');
const sanitize = require("sanitize-filename");

const logger = require('./logger');

const { DOWNLOADS_FOLDER_NAME } = require('../config');
const ROOT_FOLDER_PATH = path.resolve( __dirname, '../../' );
const DOWNLOADS_FOLDER_PATH = path.resolve( ROOT_FOLDER_PATH, DOWNLOADS_FOLDER_NAME );

const fetchZipCDFiles = url => unzipper.Open.url( request, url ).then( cd => cd.files );
const pickFiles = ( files, filenames ) => files.filter( d => filenames.indexOf( sanitize( d.path ) ) > -1 );
const handleFilesUpdate = ( files, directory ) => { 

  const writeStreams = files.map( file => {
    const writePath = path.resolve( directory, sanitize( file.path ) );
    const writeStream = fs.createWriteStream( writePath );
    file.stream().pipe( writeStream );
    return writeStream;
  });

  const writeStreamPromises = writeStreams.map( ws => {
    return new Promise( ( resolve, reject ) => {
      ws.on( 'close', () => resolve( ws.path ) );
      ws.on( 'error', () => reject( false ) );
    });
  });
  
  return Promise.all( writeStreamPromises );
};

/**
 * writeArchiveFiles
 * 
 * Download files in a compressed archive and write to a host directory
 * @param { string } url The url pointing to the compressed archive
 * @param { array } filenames An array of filenames within the archive
 * @param { string } directory The host directory to write data to, default to DOWNLOADS_FOLDER_PATH
 * @returns { array } paths written to
 */
const writeArchiveFiles = ( url, filenames, directory=DOWNLOADS_FOLDER_PATH ) => {
  const safeFilenames = filenames.map( sanitize );
  return fetchZipCDFiles( url )
    .then( files => pickFiles( files, safeFilenames ) )
    .then( files => handleFilesUpdate( files, directory ) )
    .catch( error => {
      logger.error(`Fetched archive files: Failed fetch at ${url} - ${error.message}`);
      throw error;
    });
};

module.exports = { writeArchiveFiles };