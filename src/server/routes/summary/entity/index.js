const _ = require('lodash');
const { validatorGconvert } = require('../../../external-services/gprofiler/gconvert');
const { getEntitySummary: getNcbiGeneSummary } = require('../../../external-services/ncbi');
const { getEntitySummary: getHgncSummary } = require('../../../external-services/hgnc');
const { getEntitySummary: getUniProtSummary } = require('../../../external-services/uniprot');
const { DATASOURCES, DATASOURCE_NAMES } = require('../../../../models/entity/summary');

/**
 * entityFetch: Retrieve EntitySummary for a given id from a datasource
 *
 * @param { array } localID string(s) that should be fetched
 * @return { object } value is EntitySummary keyed by the local ID
 */
const entityFetch = async ( localIds, dataSource ) => {
  let eSummary;
  switch ( dataSource ) {
    case DATASOURCES.HGNC:
      eSummary = await getHgncSummary( localIds );
      break;
    case DATASOURCES.UNIPROT:
      eSummary = await getUniProtSummary( localIds );
      break;
    default:
      eSummary = await getNcbiGeneSummary( localIds );
  }
  return eSummary;
};

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
      db = DATASOURCES.HGNC;
    } else if ( /ncbi:[0-9]+$/i.test( token ) ) {
      db = DATASOURCES.NCBIGENE;
    } else if( /uniprot:\w+$/i.test( token ) ){
      db = DATASOURCES.UNIPROT;
    }
    if( db ) return entityFetch( [ entityId ], db );
  }

  const uniqueTokens = _.uniq( tokens );
  const { alias } = await validatorGconvert( uniqueTokens, { target: DATASOURCE_NAMES.NCBI_GENE } );
  // Duplication of work (src/server/external-services/pathway-commons.js).
  // Could consider a single piece of logic that tokenizes and sends to validator.

  // get the entity summaries for successfully mapped tokens
  const mappedIds = _.values( alias );
  const summary = await entityFetch( mappedIds, DATASOURCES.NCBIGENE );

  // NCBI Gene won't give UniProt Accession, so gotta go get em
  const { alias: aliasUniProt } = await validatorGconvert( mappedIds, { target: DATASOURCE_NAMES.UNIPROT } );

  // Update the entity summaries
  _.keys( aliasUniProt ).forEach( ncbiId => {
    const eSummary = _.get( summary, ncbiId );
    if ( eSummary ) eSummary.xref[ DATASOURCES.UNIPROT ] = _.get( aliasUniProt, ncbiId );
  });

  // Want key to be original input token, unfortunately, validator transforms to upper case
  const output =  {};
  _.entries( alias ).forEach( pair => {
    const tokenIndex =  _.findIndex( uniqueTokens, t => t.toUpperCase() ===  pair[0] );
    output[ uniqueTokens[tokenIndex] ] = summary[ pair[1] ];
  });

  return output;

};

module.exports = { entitySearch, entityFetch };