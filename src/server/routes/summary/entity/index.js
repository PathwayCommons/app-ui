const _ = require('lodash');
const { validatorGconvert } = require('../../../external-services/gprofiler/gconvert');
const { getEntitySummary: getNcbiGeneSummary } = require('../../../external-services/ncbi');

/**
 * entitySearch
 *
 * @param { array } tokens string(s) that should be queried
 * @return { object } and EntitySummary keyed by the local ID
 */
const entitySearch = async tokens => {

  const { alias } = await validatorGconvert( tokens, { target: 'NCBIGene' } );
  const  ncbiIds = _.values( alias );

  // get the entity references
  const summary = await getNcbiGeneSummary( ncbiIds );

  // // // NCBI Gene won't give UniProt Accession, so gotta go get em
  const { alias: aliasUniProt } = await validatorGconvert( ncbiIds, { target: 'UniProt' } );

  // Update the entity summaries
  _.keys( aliasUniProt ).forEach( ncbiId => {
    const eSummary = _.get( summary, ncbiId );
    if ( eSummary ) eSummary.xref['http://identifiers.org/uniprot/'] = _.get( aliasUniProt, ncbiId );
  });

  return summary;
};

module.exports = { entitySearch };