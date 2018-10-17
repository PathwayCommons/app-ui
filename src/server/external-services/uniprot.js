const fetch = require('node-fetch');
const { UNIPROT_API_BASE_URL } = require('../../config');
const _ = require('lodash');
const { EntitySummary, DATASOURCES } = require('../../models/entity/summary');
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

const getEntitySummary = async ( accessions ) => {

  const summary = {};
  if ( _.isEmpty( accessions ) ) return summary;

  const results = await fetchByAccessions( accessions );
  if ( _.has( results, 'errorMessage') ) return summary;

  results.forEach( doc => {

    const accession = _.get( doc, 'accession', '');
    const eSummary = new EntitySummary(
      DATASOURCES.UNIPROT,
      _.get( doc, 'protein.recommendedName.fullName.value', ''),
      accession,
      _.get( doc, 'comments[0].text[0].value', ''),
      _.get( doc, 'protein.alternativeName', []).map( elt =>  _.get( elt, 'fullName.value') ),
      _.get( doc, 'protein.recommendedName.shortName', []).map( elt =>  _.get( elt, 'value') )
    );

    // Add database links
    doc.dbReferences.forEach( xrf => {
      if ( xrf.type === 'GeneID' ) {
        eSummary.xref[DATASOURCES.NCBIGENE]
          = _.get( xrf, 'id', '');
      }
      if ( xrf.type === 'HGNC' ) {
        eSummary.xref[DATASOURCES.HGNC]
          =  _.get( xrf, "properties['gene designation']");
          eSummary.xref[DATASOURCES.GENECARDS]
          =  _.get( xrf, "properties['gene designation']");
      }
    });

    return summary[ accession ] = eSummary;
  });

  return summary;
};

module.exports = { getEntitySummary };