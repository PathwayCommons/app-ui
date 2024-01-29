const _ = require( 'lodash' );
const stream = require( 'stream' );
const path = require( 'path' );
const { program } = require( 'commander' );
const zlib = require( 'zlib' );
const nodefetch = require( 'node-fetch' );
const fs = require( 'fs' );
const fsPromises = require('fs').promises;
const readline = require( 'readline' );
const retry = require( 'async-retry' );

const { uri2filename } = require( '../util/uri.js' );
const logger = require( '../server/logger.js' );
const {
  DOWNLOADS_FOLDER_NAME,
  SBGN_IMG_SERVICE_BASE_URL,
  SBGN_IMG_PATH
} = require( '../config.js' );
const { fetch } = require( '../util/index.js' );
const pc = require( '../server/external-services/pathway-commons.js' );

global.fetch = nodefetch;

/**
 * Source (download and extract) a file
 *
 * @param {string} url The url for the file
 * @param {string} options command line opts
 * @returns
 */
async function source( url, options ){
  try {
    let extractor;
    const { file, type } = options;
    switch( type ) {
      case 'zip':
        extractor = zlib.createUnzip();
        break;
      case 'gzip':
        extractor = zlib.createGunzip();
        break;
      default:
        extractor = new stream.PassThrough();
    }
    const outfile = path.resolve( DOWNLOADS_FOLDER_NAME, file );
    const outstream = fs.createWriteStream( outfile );
    const response = await fetch( url );
    return response.body.pipe( extractor ).pipe( outstream );

  } catch (err) {
    throw err;
  }
}

/**
 * Get a PNG image given SBGN-ML
 *
 * @param {string} sbgn The sbgn xml text
 * @param {object} opts Options for the image service {@link https://github.com/iVis-at-Bilkent/syblars?tab=readme-ov-file#usage}
 * @returns base64 encoded PNG
 */
async function sbgn2image( sbgn, opts ){
  const decodeBase64img = str => {
    const extractFields = s => {
      const { groups } = s.match(/^data:(?<mediatype>.*);(?<encoding>.*),(?<base64str>.*)$/);
      return groups;
    };
    const { base64str, encoding, mediatype } = extractFields(str);
    const data = Buffer.from( base64str, encoding );
    return { data, mediatype };
  };
  let url = `${SBGN_IMG_SERVICE_BASE_URL}sbgnml`;
  const defaults = {
    layoutOptions: {
      name: 'fcose',
      randomize: true,
      padding: 30
    },
    imageOptions: {
      format: 'png',
      background: 'transparent',
      color: 'black_white'
    }
  };
  const imageOpts = _.defaults( opts, defaults );
  const imageOptsString = JSON.stringify( imageOpts );
  const body = `${sbgn}${imageOptsString}`;
  const fetchOpts = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Accept': 'application/json'
    },
    body
  };

  try {
    const response = await fetch( url , fetchOpts );
    const { image } = await response.json();
    return decodeBase64img( image );

  } catch ( err ) {
    logger.error( err );
    throw err;
  }
}

/**
 * Iterate over each line in a PC GMT file and retrieve an image, save to store.
 * @param {string} fpath file path to the GMT file
 * @param {object} store persistence via save function
 * @param {object} get data retrieval
 * @param {object} parse function to extract information from each line in GMT
 * @param {object} convert function to map data to image
 */
async function imagesFromGmtFile( fpath, store, get, parse, convert ) {
  let rl;
  try {
    const handleLine = async ({ value }) => {
      const { uri, meta, genes } = parse( value );
      logger.info( `Handling pathway "${meta.name}" from ${meta.source}` );
      const markup = await get({ uri, format: 'sbgn' });
      const image = await convert( markup );
      const item = _.assign( {}, { uri, genes, image }, meta );
      await store.save( item );
    };
    const input = fs.createReadStream( fpath );
    rl = readline.createInterface( { input, crlfDelay: Infinity });
    const it = rl[Symbol.asyncIterator]();
    let line = await it.next();

    while( !line.done ){
      await retry(
        async (bail, count) => {
          try {
            logger.info( `------------------------------` );
            logger.info(`Processing line: attempt ${count}`);
            await handleLine( line );
            line = await it.next();
          } catch (err) {
            logger.error(`Fatal error processing`);
            if( err.name === 'FetchError' ) bail( err );
          }
        },
        { retries: 3 }
      );

    }

  } catch ( err ) {
    logger.error( err );
    throw err;

  } finally {
    rl.close();
  }
}

// ambiguous: e.g. value[1] = 'name: t(4;14) translocations of FGFR3; datasource: reactome; organism: 9606; idtype: hgnc symbol'
const parsePCGmtLine = line => {
  const extractFields = str => str.match(/^name:\s(?<name>.*);\sdatasource:\s(?<source>.*);\sorganism:\s(?<organism>.*);\sidtype:\s(?<idtype>.*)$/);
  const parseMeta = value => {
    const { groups } = extractFields( value );
    return groups;
  };
  const values = line.split('\t');
  const uri = values[0];
  const meta = parseMeta( values[1] );
  const genes = values.slice(2);
  return { uri, meta, genes };
};

async function getStore( ) {
  const store = {
    async save( item ){
      const { uri, image: { data, mediatype } } = item;
      const ext = mediatype.split('/')[1];
      const filename = uri2filename( uri );
      const fpath = path.resolve( SBGN_IMG_PATH, `${filename}.${ext}` );
      try {
        await fsPromises.writeFile( fpath, data );
        logger.info(`Saved item at ${uri} to file`);

      } catch (err) {
        logger.error(`Error saving data for ${uri}`);
        logger.error(err);
        throw err;
      }
    },

    close(){
      logger.info(`TODO: close store`);
    }
  };
  return store;
}

/**
 * Generate images for all pathways in a PC .gmt file
 *
 * @param {object} options Command line opts
 */
async function snapshot( options ){
  const { file } = options;
  const fpath = path.resolve( DOWNLOADS_FOLDER_NAME, file );
  let store;
  try {
    store = await getStore();
    await imagesFromGmtFile( fpath, store, pc.query, parsePCGmtLine, sbgn2image );

  } catch ( err ) {
    logger.error( err );
    throw err;

  } finally {
    await store.close();
  }
}

async function main () {
  (program
    .name( 'app-ui' )
    .description( 'A CLI for processing pathway data' )
  );

  ( program.command( 'source' )
    .description( 'Source (download and extract) a file' )
    .argument( '<url>', 'URL of source file' )
    .requiredOption( '-f, --file <name>', 'Name of output file' )
    .option( '-t, --type <type>', 'Compression type', 'gzip' )
    .action( source )
  );

  ( program.command( 'snapshot' )
    .description( 'Generate images for all pathways in a PC gmt file' )
    .requiredOption( '-f, --file <name>', 'Name of PC-formatted gmt source file' )
    .action( snapshot )
  );

  await program.parseAsync();
}

main();

module.exports = { snapshot, source };