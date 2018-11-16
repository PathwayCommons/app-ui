const _ = require('lodash');
const logger = require('../../logger');

const { NS_NCBI_GENE, NS_HGNC_SYMBOL } = require('../../../config');
const { validatorGconvert } = require('../../external-services/gprofiler/gconvert');
const pc = require('../../external-services/pathway-commons');
const { entityFetch } = require('../summary/entity');

const QUERY_MAX_CHARS = 5000; //temp - to be in config
const QUERY_MAX_TOKENS = 100; //temp - to be in config
const RAW_SEARCH_MAX_CHARS = 250; //temp - to be in config
const INTERACTION_GENES_COUNT_THRESHOLD = 5;

const PATHWAY_SEARCH_DEFAULTS = {
  q: '',
  type: 'pathway'
};

// Get the HGNC Symbol from an EntitySummary's xrefLinks
const hgncSymbolsFromXrefs = xrefLinks => {
  let symbol;
  const hgncXrefLink = _.find( xrefLinks, link  => link.namespace === NS_HGNC_SYMBOL );
  if( hgncXrefLink ) symbol = _.last( _.compact( hgncXrefLink.uri.split('/') ) );
  return symbol;
};

const sanitize = ( rawQuery, maxLength = QUERY_MAX_CHARS ) => rawQuery.trim().substring( 0, maxLength );
const tokenize = ( rawQuery, maxNum = QUERY_MAX_TOKENS ) => rawQuery.split(/,?\s+/).slice( 0, maxNum ); //  limit token size?

// Map tokens to a given collection (NS_NCBI_GENE)
const pickEntityIds = async ( query, namespace = NS_NCBI_GENE ) => {
  const tokens = tokenize( query );
  const uniqueTokens = _.uniq( tokens );
  const { alias } = await validatorGconvert( uniqueTokens, { target: namespace } );
  const geneIds = _.values( alias );
  return geneIds;
};

// Get the info related to gene-based interactions
const geneInteraction = async entityIds => {
  const summaries = await entityFetch( entityIds, NS_NCBI_GENE );
  const sources = summaries.map( summary => hgncSymbolsFromXrefs( summary.xrefLinks ) );
  return { sources, summaries };
};

// Return information about networks
// Logic herein decides type of data (genes [, pathways])
const searchNetworks = async query => {
  const result = {};

  try {
    const entityIds = await pickEntityIds( query );
    if ( entityIds.length && entityIds.length <= INTERACTION_GENES_COUNT_THRESHOLD ) {
      result.genes = await geneInteraction( entityIds );
    }
    return result;

  } catch( error ) { //swallow
    logger.error( `An error was encountered in searchInteractions - ${error}` );
    return result;
  }
};

// Simple wrapper for pc search
const searchPathways = query => {
  const sanitized = sanitize( query, RAW_SEARCH_MAX_CHARS );
  const opts = _.assign( {}, PATHWAY_SEARCH_DEFAULTS, { q: sanitized });
  return pc.search( opts );
};

/**
 * search
 * App search entrypoint which coordinates queries for pathways and other info (interactions).
 * @param { String } query Raw input to search by
 */
const search = async ( query ) => {
<<<<<<< HEAD
  return Promise.all([ searchNetworks( query ), searchPathways( query ) ])
    .then( ([ networks, pathways ]) => ({ networks, pathways }) );
=======
  return Promise.all([ searchInteractions( query ), searchPathways( query ) ])
    .then( ([ interactions, pathways ]) => ({ interactions, pathways }) );
>>>>>>> c866f9ed5896cf70cd325aeac22099954360fa63
};

module.exports = { search };