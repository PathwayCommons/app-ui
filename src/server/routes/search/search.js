const _ = require('lodash');

const { NS_NCBI_GENE, NS_HGNC_SYMBOL, NS_UNIPROT } = require('../../../config');

const { getEntitySummary: getNcbiGeneSummary } = require('../../external-services/ncbi');
const { validatorGconvert } = require('../../external-services/gprofiler/gconvert');
const pc = require('../../external-services/pathway-commons');

const QUERY_MAX_CHARS = 5000; //temp - to be in config
const QUERY_MAX_TOKENS = 100; //temp - to be in config
const RAW_SEARCH_MAX_CHARS = 250; //temp - to be in config

const PATHWAY_SEARCH_DEFAULTS = {
  q: '',
  type: 'pathway'
};

// Get the identifier from an EntitySummary's xrefLinks
const idFromXrefs = ( xrefLinks, namespace ) => {
  const xref = _.find( xrefLinks, link  => link.namespace === namespace );
  return xref ? _.last( _.compact( xref.uri.split('/') ) ) : undefined;
};

const sanitize = ( rawQuery, maxLength = QUERY_MAX_CHARS ) => rawQuery.trim().substring( 0, maxLength );
const splitOnWhitespace = tokens => _.flatten( tokens.map( t => t.split(/\s+/) ) );
const splitOnCommas = queryString => queryString.split(/,/).map( t => t.trim() );
const tokenize = ( rawQuery, maxNum = QUERY_MAX_TOKENS ) => splitOnWhitespace( splitOnCommas( rawQuery ) ).slice( 0, maxNum );

// Take the entity summaries (summaries) and augment with xref corresponding to recommended name (name)
const fillInXref = async ( summaries, ncbiAlias, uniprotAlias, name ) => {
  const tokensWithUniprot = _.keys( uniprotAlias );
  for( const token of tokensWithUniprot ){
    const ncbiGeneId = ncbiAlias[ token ];
    const eSummary = _.find( summaries, s => s.localId === ncbiGeneId );
    const hasUniProt = idFromXrefs( _.get( eSummary, 'xrefLinks' ), NS_UNIPROT );
    if ( eSummary && !hasUniProt ) {
      // Use our internal service to grab the xref info
      const xref = await pc.xref2Uri( name, _.get( uniprotAlias, token ) );
      eSummary.xrefLinks.push( xref );
    }
  }
};

// Create an entity summary using NCBI, augmented with UniProt Xref
const getNcbiSummary = async ( ncbiAlias, uniprotAlias ) => {
  const ncbiIds = _.values( ncbiAlias );
  const summaries = await getNcbiGeneSummary( ncbiIds );
  await fillInXref( summaries, ncbiAlias, uniprotAlias, NS_UNIPROT );
  return summaries;
};

// Collect the summary, HGNC symbol and original query
const getGeneInfo = async ( uniqueTokens, ncbiAlias, uniprotAlias ) => {
  let geneInfo = [];
  const eSummaries = await getNcbiSummary( ncbiAlias, uniprotAlias );

  _.entries( ncbiAlias ).forEach( pair => { // pair is [ <token>, <ncbi gene id>]
    // get index of the original input token (must exist)
    const indexOfToken =  _.findIndex( uniqueTokens, t => t.toUpperCase() ===  pair[0] );
    // get index of the summary (must exist)
    const indexOfSummary =  _.findIndex( eSummaries, s => s.localId ===  pair[1] );
    const summary = eSummaries[ indexOfSummary ];
    geneInfo.push({
      query: uniqueTokens[ indexOfToken ],
      geneSymbol: idFromXrefs( summary.xrefLinks, NS_HGNC_SYMBOL ),
      summary
    });
  });
  return geneInfo;
};

const errorHandler = () => [];

// Return information about genes
const searchGenes = query => {
  const rawQuery = query;
  const tokens = tokenize( rawQuery );
  const uniqueTokens = _.uniq( tokens );

  return Promise.all([
    uniqueTokens,
    validatorGconvert( uniqueTokens, { target: NS_NCBI_GENE } ),
    validatorGconvert( uniqueTokens, { target: NS_UNIPROT } )
  ])
  .then( ([ uniqueTokens, ncbiValidation, uniprotValidation ]) => {
    const { alias: ncbiAlias } = ncbiValidation;
    const { alias: uniprotAlias } = uniprotValidation;
    return getGeneInfo( uniqueTokens, ncbiAlias, uniprotAlias );
  })
  .catch( errorHandler );
};

// Simple wrapper for pc search
const searchPathways = query => {
  const rawQuery = query.q;
  const sanitized = sanitize( rawQuery, RAW_SEARCH_MAX_CHARS );
  const opts = _.assign( {}, PATHWAY_SEARCH_DEFAULTS, query, { q: sanitized });
  return pc.search( opts )
    .catch( errorHandler );
};

/**
 * search
 * App search entrypoint which coordinates queries for pathways and other info (interactions).
 * @param { String } query Raw input to search by
 */
const search = async ( query ) => {
  return Promise.all([ searchGenes( query.q ), searchPathways( query ) ])
    .then( ([ genes, pathways ]) => {
      return { genes, pathways };
    } );
};

module.exports = { search, searchGenes };