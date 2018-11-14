const _ = require('lodash');

const { NS_NCBI_GENE } = require('../../../config');
const { validatorGconvert } = require('../../external-services/gprofiler/gconvert');

/**
 * search base endpoint - coordinates downstream queries for pathways and interactions.
 * query {string} the input phrase
 */
const search = async ( query ) => {

  const phrase = query.trim();
  const tokens = phrase.split(/,?\s+/);

  // send to validator
  const uniqueTokens = _.uniq( tokens );
  const { alias } =  await validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } );

  // forward validated to interactions

  // forward santized to pc.search
  return alias;
};

module.exports = search;