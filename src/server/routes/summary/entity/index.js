const _ = require('lodash');
const QuickLRU = require('quick-lru');

const { validatorGconvert } = require('../../../external-services/gprofiler/gconvert');
const { getEntitySummary: getNcbiGeneSummary } = require('../../../external-services/ncbi');
const { getEntitySummary: getHgncSummary } = require('../../../external-services/hgnc');
const { getEntitySummary: getUniProtSummary } = require('../../../external-services/uniprot');
const { NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_UNIPROT, IDENTIFIERS_URL, PC_CACHE_MAX_SIZE } = require('../../../../config');
const { cachePromise } = require('../../../cache');
const pcCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });
/**
 * entityFetch: Retrieve EntitySummary for a given id from a datasource
 *
 * @param { array } localID string(s) that should be fetched
 * @return { object } value is EntitySummary keyed by the local ID
 */
const rawEntityFetch = async ( localIds, dataSource ) => {
  let eSummary;
  switch ( dataSource ) {
    case NS_HGNC_SYMBOL:
      eSummary = await getHgncSummary( localIds );
      break;
    case NS_UNIPROT:
      eSummary = await getUniProtSummary( localIds );
      break;
    default:
      eSummary = await getNcbiGeneSummary( localIds );
  }
  return eSummary;
};

const createUri = ( namespace, localId ) => IDENTIFIERS_URL + '/' + namespace + '/' + localId;

/**
 * entitySearch: Search a list of strings for recognized gene/protein identifiers
 * and return an EntitySummary for each
 *
 * @param { array } tokens string(s) that should be queried
 * @return { object }
 *   - query: token that has an associated NCBI Gene ID
 *   - EntitySummary object
 */
const rawEntitySearch = async tokens => {

  const results = [];

  // look for special tokens
  if ( tokens.length === 1 ) {
    let db;
    const token = tokens[0];
    const [ dbId, entityId ] = token.split(':'); // eslint-disable-line no-unused-vars
    if( /hgnc:\w+$/i.test( token ) ){
      db = NS_HGNC_SYMBOL;
    } else if ( /ncbi:[0-9]+$/i.test( token ) ) {
      db = NS_NCBI_GENE;
    } else if( /uniprot:\w+$/i.test( token ) ){
      db = NS_UNIPROT;
    }
    if( db ) return entityFetch( [ entityId ], db );
  }

  const uniqueTokens = _.uniq( tokens );
  const { alias: aliasNCBIGene } = await validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } );

  // get the entity summaries for successfully mapped tokens
  const mappedIds = _.values( aliasNCBIGene );
  const summaries = await entityFetch( mappedIds, NS_NCBI_GENE );

  // NCBI Gene won't give UniProt Accession, so gotta go get em
  const { alias: aliasUniProt } = await validatorGconvert( mappedIds, { target: NS_UNIPROT } );

  // Push in the UniProt xrefLinks into each matching Summary, may not be available
  // since some genes may not have am associated protein.
  _.keys( aliasUniProt ).forEach( ncbiId => {
    const eSummary = _.find( summaries, s => s.localId === ncbiId );
    if ( eSummary ) eSummary.xrefLinks.push({
      namespace: NS_UNIPROT,
      uri: createUri(NS_UNIPROT, _.get( aliasUniProt, ncbiId ))
    });
  });

  // Format the output as object with keys: query, EntitySummary
  // Unfortunately, validator transforms original query to upper-case
  // const output =  {};
  _.entries( aliasNCBIGene ).forEach( pair => { // pair is [ <token>, <ncbi gene id>]

    // get index of the original input token (must exist)
    const indexOfToken =  _.findIndex( uniqueTokens, t => t.toUpperCase() ===  pair[0] );

    // get index of the summary (must exist)
    const indexOfSummary =  _.findIndex( summaries, s => s.localId ===  pair[1] );

    results.push({
      query: uniqueTokens[ indexOfToken ],
      summary: summaries[ indexOfSummary ]
    });
  });

  return results;
};

const entitySearch = cachePromise(rawEntitySearch, pcCache);
const entityFetch = cachePromise(rawEntityFetch, pcCache);

module.exports = { entitySearch, entityFetch };