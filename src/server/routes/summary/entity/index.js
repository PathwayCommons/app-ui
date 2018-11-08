const _ = require('lodash');
const { validatorGconvert } = require('../../../external-services/gprofiler/gconvert');
const { getEntitySummary: getNcbiGeneSummary } = require('../../../external-services/ncbi');
const { getEntitySummary: getHgncSummary } = require('../../../external-services/hgnc');
const { getEntitySummary: getUniProtSummary } = require('../../../external-services/uniprot');
const { NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_UNIPROT, IDENTIFIERS_URL } = require('../../../../config');

/**
 * entityFetch: Retrieve EntitySummary for a given id from a datasource
 *
 * @param { array } localID string(s) that should be fetched
 * @return { object } value is EntitySummary keyed by the local ID
 */
const entityFetch = async ( localIds, dataSource ) => {
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
 * @return { object } value is EntitySummary keyed by the input token
 */
const entitySearch = async tokens => {

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
  const { alias } = await validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } );

  // get the entity summaries for successfully mapped tokens
  const mappedIds = _.values( alias );
  const summaries = await entityFetch( mappedIds, NS_NCBI_GENE );

  // NCBI Gene won't give UniProt Accession, so gotta go get em
  const { alias: aliasUniProt } = await validatorGconvert( mappedIds, { target: NS_UNIPROT } );

  // Push in the UniProt xrefLinks into each Summary if available
  _.keys( aliasUniProt ).forEach( ncbiId => {
    const eSummary = _.find( summaries, s => s.localId === ncbiId );
    if ( eSummary ) eSummary.xrefLinks.push({
      "namespace": NS_UNIPROT,
      "uri": createUri(NS_UNIPROT, _.get( aliasUniProt, ncbiId ))
    });
  });

  // // Want key to be original input token, unfortunately, validator transforms to upper case
  // const output =  {};
  // _.entries( alias ).forEach( pair => {
  //   const tokenIndex =  _.findIndex( uniqueTokens, t => t.toUpperCase() ===  pair[0] );
  //   output[ uniqueTokens[tokenIndex] ] = summary[ pair[1] ];
  // });

  return summaries;
};

module.exports = { entitySearch, entityFetch };