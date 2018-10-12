const _ = require('lodash');
const { validatorGconvert } = require('../../../external-services/gprofiler/gconvert');
const { getEntitySummary: getNcbiGeneSummary } = require('../../../external-services/ncbi');
const { getEntitySummary: getHgncSummary } = require('../../../external-services/hgnc');
const { getEntitySummary: getUniProtSummary } = require('../../../external-services/uniprot');

const dataSources = {
  NCBIGENE: 'http://identifiers.org/ncbigene/',
  HGNC: 'http://identifiers.org/hgnc/',
  UNIPROT: 'http://identifiers.org/uniprot/'
};

/**
 * entityFetch: Retrieve EntitySummary for a given id from a datasource
 *
 * @param { array } localID string(s) that should be fetched
 * @return { object } value is EntitySummary keyed by the local ID
 */
const entityFetch = async ( localIds, dataSource ) => {
  let eSummary;
  switch ( dataSource ) {
    case dataSources.HGNC:
      eSummary = await getHgncSummary( localIds );
      break;
    case dataSources.UNIPROT:
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
 * @return { object } value is EntitySummary keyed by the local ID
 */
const entitySearch = async tokens => {

  let summary = {};

  // look for special tokens
  if ( tokens.length === 1 ) {
    const token = tokens[0];
    const [ dbId, entityId ] = token.split(':');
    if( /hgnc:\w+$/i.test( token ) ){
      summary = await getHgncSummary( [ entityId ], dataSources.HGNC );
    } else if ( /ncbi:[0-9]+$/i.test( token ) ) {
      summary = await getNcbiGeneSummary( [ entityId ], dataSources.NCBIGENE );
    } else if( /uniprot:\w+$/i.test( token ) ){
      summary = await getUniProtSummary( [ entityId ], dataSources.UNIPROT );
    }
    return summary;
  }

  const { alias } = await validatorGconvert( tokens, { target: 'NCBIGene' } );
  const  ncbiIds = _.values( alias );

  // get the entity references
  summary = await entityFetch( ncbiIds );

  // NCBI Gene won't give UniProt Accession, so gotta go get em
  const { alias: aliasUniProt } = await validatorGconvert( ncbiIds, { target: 'UniProt' } );

  // Update the entity summaries
  _.keys( aliasUniProt ).forEach( ncbiId => {
    const eSummary = _.get( summary, ncbiId );
    if ( eSummary ) eSummary.xref['http://identifiers.org/uniprot/'] = _.get( aliasUniProt, ncbiId );
  });

  return summary;
};

module.exports = { entitySearch, entityFetch };