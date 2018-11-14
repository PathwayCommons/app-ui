const _ = require('lodash');

const { NS_NCBI_GENE } = require('../../../config');
const { validatorGconvert } = require('../../external-services/gprofiler/gconvert');
const pc = require('../../external-services/pathway-commons');
const { entityFetch } = require('../summary/entity');

const ENTITY_SUMMARY_DISPLAY_LIMIT = 6; //temp - from the summary box
const SEARCH_DEFAULTS = {
  q: '',
  type: 'pathway'
};

// Simple wrapper around the pc search module
const getPathways = phrase => {
  const opts = _.assign( {}, SEARCH_DEFAULTS, { q: phrase });
  return pc.search( opts );
};

// Coordinates the retrieval of relevant data that would constituate a box/card
// Chooses based on the number of genes recognized in phrase
const getCard = async phrase => {
  const tokens = phrase.split(/,?\s+/);
  const uniqueTokens = _.uniq( tokens );
  const { alias } = await validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } );

  if( _.values( alias ).length < ENTITY_SUMMARY_DISPLAY_LIMIT ) {
    return {
      summary: await entityFetch( _.values( alias ), NS_NCBI_GENE )
    };
  } else {
    return []; //enrichment data
  }
};

/**
 * search base endpoint - coordinates downstream queries for pathways and interactions.
 * query {string} the input phrase
 */
const search = async ( query ) => {

  const phrase = query.trim();

  return Promise.all([ getCard( phrase ), getPathways( phrase ) ])
   .then( ([ card, pathways ]) => ({ card, pathways }) );
};

module.exports = { search };