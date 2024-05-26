const { fetch } = require('../../util');
const { UNIPROT_API_BASE_URL, NS_GENECARDS, NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_UNIPROT, IDENTIFIERS_URL } = require('../../config');
const _ = require('lodash');
const { EntitySummary } = require('../../models/entity/summary');
const logger = require('../logger');

//Could cache somewhere here.
const fetchByAccessions = ( accessions ) => {
  return fetch( `${UNIPROT_API_BASE_URL}/proteins?offset=0&accession=${accessions.join(',')}`,
    { headers: {
      'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .catch( error => {
      logger.error(`${error.name} in uniprot fetchByAccessions: ${error.message}`);
      throw error;
    });
};

const createUri = ( namespace, localId ) => IDENTIFIERS_URL + '/' + namespace + ':' + localId;

const getEntitySummary = async ( accessions ) => {

  const summary = [];
  if ( _.isEmpty( accessions ) ) return summary;

  const results = await fetchByAccessions( accessions );
  if ( _.has( results, 'errorMessage') ) return summary;

  results.forEach( doc => {

    const accession = _.get( doc, 'accession', '');

    // Create external database links first
    const xrefLinks = [{
      namespace: NS_UNIPROT,
      uri: createUri( NS_UNIPROT, accession )
    }];
    doc.dbReferences.forEach( xrf => {
      switch ( xrf.type ){
        case 'HGNC':
          xrefLinks.push({
            namespace: NS_GENECARDS,
            uri: createUri( NS_GENECARDS, _.get( xrf, 'properties["gene designation"]' ) )
          });
          xrefLinks.push({
            namespace: NS_HGNC_SYMBOL,
            uri: createUri( NS_HGNC_SYMBOL, _.get( xrf, 'properties["gene designation"]' ) )
          });
          break;
        case 'GeneID':
          xrefLinks.push({
            namespace: NS_NCBI_GENE,
            uri: createUri( NS_NCBI_GENE, _.get( xrf, 'id', '') )
          });
          break;
      }
    });
    const eSummary = new EntitySummary({
      namespace: NS_UNIPROT,
      displayName: _.get( doc, 'protein.recommendedName.fullName.value', ''),
      localId: accession,
      description: _.get( doc, 'comments[0].text[0].value', ''),
      aliases: _.get( doc, 'protein.alternativeName', []).map( elt =>  _.get( elt, 'fullName.value') ),
      aliasIds: _.get( doc, 'protein.recommendedName.shortName', []).map( elt =>  _.get( elt, 'value') ),
      xrefLinks: xrefLinks
    });

    summary.push(eSummary);
  });

  return summary;
};

module.exports = { getEntitySummary };