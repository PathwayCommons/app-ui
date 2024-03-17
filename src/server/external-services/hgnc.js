const { fetch } = require('../../util');
const _ = require('lodash');
const { HGNC_BASE_URL, NS_GENECARDS, NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_UNIPROT, IDENTIFIERS_URL } = require('../../config');
const { EntitySummary } = require('../../models/entity/summary');
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

const createUri = ( namespace, localId ) => IDENTIFIERS_URL + '/' + namespace + ':' + localId;

const getEntitySummary = async symbols => {

  const summary = [];
  if ( _.isEmpty( symbols ) ) return summary;

  const results = await fetchBySymbols( symbols );
  const nonEmptyResults = results.filter( o => _.get( o, 'response.numFound') );
  const docList = nonEmptyResults.map( o => _.get( o, 'response.docs[0]') );
  docList.forEach( doc => {

    const symbol = _.get( doc, 'symbol', '');

    // Add database links
    const xrefLinks = [{
      namespace: NS_GENECARDS,
      uri: createUri( NS_GENECARDS, symbol )
    }, {
      namespace: NS_HGNC_SYMBOL,
      uri: createUri( NS_HGNC_SYMBOL, symbol )
    }];

    if ( _.has( doc, 'entrez_id') ){
      xrefLinks.push({
        namespace: NS_NCBI_GENE,
        uri: createUri( NS_NCBI_GENE, _.get( doc, 'entrez_id') )
      });
    }

    if ( _.has( doc, 'uniprot_ids') ){
      xrefLinks.push({
        namespace: NS_UNIPROT,
        uri: createUri( NS_UNIPROT, _.get( doc, 'uniprot_ids') )
      });
    }

    const eSummary = new EntitySummary({
      namespace: NS_HGNC_SYMBOL,
      displayName: _.get( doc, 'name', ''),
      localId: symbol,
      aliases: _.get( doc, 'alias_name', []),
      aliasIds:_.get( doc, 'alias_symbol', []),
      xrefLinks: xrefLinks
    });

    summary.push(eSummary);
  });

  return summary;
};

module.exports = { getEntitySummary };