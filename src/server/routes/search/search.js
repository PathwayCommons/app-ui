const _ = require('lodash');

const { NS_NCBI_GENE } = require('../../../config');
const { validatorGconvert } = require('../../external-services/gprofiler/gconvert');
const pc = require('../../external-services/pathway-commons');
const { entityFetch } = require('../summary/entity');

const QUERY_MAX_CHARS = 5000; //temp - to be in config
const QUERY_MAX_TOKENS = 100; //temp - to be in config
const RAW_SEARCH_MAX_CHARS = 250; //temp - to be in config
const ENTITY_SUMMARY_DISPLAY_LIMIT = 6; //temp - stoelen from the summary box

const PATHWAY_SEARCH_DEFAULTS = {
  q: '',
  type: 'pathway'
};

const sanitize = ( rawQuery, maxLength = QUERY_MAX_CHARS ) => rawQuery.trim().substring( 0, maxLength );
const tokenize = ( rawQuery, maxNum = QUERY_MAX_TOKENS ) => rawQuery.split(/,?\s+/).slice( 0, maxNum ); //  limit token size?

// Simple wrapper around the pc search module
const getPathways = query => {
  const sanitized = sanitize( query, RAW_SEARCH_MAX_CHARS );
  const opts = _.assign( {}, PATHWAY_SEARCH_DEFAULTS, { q: sanitized });
  return pc.search( opts );
};

// Coordinates test and retrieval of data based on mapped gene IDs
const getCard = async query => {
  const tokens = tokenize( query );
  const uniqueTokens = _.uniq( tokens );

  // Could check here for 'special tokens' i.e. prefix with 'ncbi:' | 'hgnc:' rather than inside entitySearch
  const { alias } = await validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } );
  const mapped = _.values( alias );

  if( mapped.length && mapped.length <= ENTITY_SUMMARY_DISPLAY_LIMIT ) {

    return {
      entities: await entityFetch( _.values( alias ), NS_NCBI_GENE ) // Should use/update entitySearch() to drop redundant tasks
    };

  } else if ( mapped.length ) {
    return { enrichment: [] }; // stub for enrichment

  } else {
    return null;
  }
};

/**
 * search base endpoint - coordinates downstream queries for pathways and interactions.
 * query {string} the input phrase
 */
const search = async ( query ) => {

  return Promise.all([ getCard( query ), getPathways( query ) ])
   .then( ([ card, pathways ]) => ({ card, pathways }) );
};

module.exports = { search };