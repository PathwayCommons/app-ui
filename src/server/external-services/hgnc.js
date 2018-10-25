const { fetch } = require('../../util');
const _ = require('lodash');
const { HGNC_BASE_URL } = require('../../config');
const { EntitySummary, DATASOURCES } = require('../../models/entity/summary');
const logger = require('../logger');

//Could cache somewhere here.
const fetchBySymbol = symbol => {
  return fetch( `${HGNC_BASE_URL}/fetch/symbol/${symbol}`,
    { headers: {
      'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .catch( error => {
      logger.error(`${error.name} in hgnc fetchBySymbol: ${error.message}`);
      throw error;
    });
};

const fetchBySymbols = symbols => Promise.all( symbols.map(fetchBySymbol) );

const getEntitySummary = async symbols => {

  const summary = {};
  if ( _.isEmpty( symbols ) ) return summary;

  const results = await fetchBySymbols( symbols );
  const nonEmptyResults = results.filter( o => _.get( o, 'response.numFound') );
  const docList = nonEmptyResults.map( o => _.get( o, 'response.docs[0]') );
  docList.forEach( doc => {

    const symbol = _.get( doc, 'symbol', '');
    const xref = {
      [DATASOURCES.GENECARDS] : symbol
    };
    // Add database links
    if ( _.has( doc, 'entrez_id') ){
      xref[DATASOURCES.NCBIGENE]  = _.get( doc, 'entrez_id');
    }
    if ( _.has( doc, 'uniprot_ids') ){
      xref[DATASOURCES.UNIPROT] = _.get( doc, 'uniprot_ids[0]', '');
    }
    const eSummary = new EntitySummary({
      dataSource: DATASOURCES.HGNC,
      displayName: _.get( doc, 'name', ''),
      localID: symbol,
      aliases: _.get( doc, 'alias_name', []),
      aliasIds:_.get( doc, 'alias_symbol', []),
      xref: xref
    });

    return summary[ symbol ] = eSummary;
  });

  return summary;
};

module.exports = { getEntitySummary };