const fetch = require('node-fetch');
const _ = require('lodash');
const { HGNC_BASE_URL } = require('../../config');
const { EntitySummary, DATASOURCES } = require('../../models/entity/summary');

//Could cache somewhere here.
const fetchBySymbol = symbol => {
  return fetch( `${HGNC_BASE_URL}/fetch/symbol/${symbol}`,
    { headers: {
      'Accept': 'application/json'
      }
    })
    .then(res => res.json());
};

const fetchBySymbols = async symbols => {
  const docs = symbols.map( async symbol => {
    // Process each symbol individually
    const result = await fetchBySymbol( symbol );
    if( result.response.numFound !== 1 ) return;
    return result.response.docs[0];
  });
  return await Promise.all( docs );
};

const getEntitySummary = async symbols => {

  const summary = {};
  if ( _.isEmpty( symbols ) ) return summary;

  const results = await fetchBySymbols( symbols );
  results.forEach( doc => {

    const symbol = _.get( doc, 'symbol', '');
    const eSummary = new EntitySummary(
      DATASOURCES.HGNC,
      _.get( doc, 'name', ''),
      symbol,
      '',
      _.get( doc, 'alias_name', []),
      _.get( doc, 'alias_symbol', []),
      {
        [DATASOURCES.GENECARDS] : symbol
      }
    );
    // Add database links
    if ( _.has( doc, 'entrez_id') ){
      eSummary.xref[DATASOURCES.NCBIGENE]  = _.get( doc, 'entrez_id');
    }
    if ( _.has( doc, 'uniprot_ids') ){
      eSummary.xref[DATASOURCES.UNIPROT] = _.get( doc, 'uniprot_ids[0]', '');
    }

    return summary[ symbol ] = eSummary;
  });

  return summary;
};

module.exports = { getEntitySummary };