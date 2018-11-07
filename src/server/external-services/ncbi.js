const { fetch } = require('../../util');
const { NCBI_EUTILS_BASE_URL, PUB_CACHE_MAX_SIZE } = require('../../config');
const { URLSearchParams } = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');
const { EntitySummary, DATASOURCES } = require('../../models/entity/summary');
const logger = require('../logger');

const pubCache = new QuickLRU({ maxSize: PUB_CACHE_MAX_SIZE });

const processPublications = res => {
  let { result } = res;

  if( result == null ){ return []; }

  let { uids } = result;

  return uids.map( id => {
    let { title, authors, sortfirstauthor: firstAuthor, sortpubdate: date, source } = result[id];

    return { id, title, authors, firstAuthor, date, source };
  } );
};

const sortPublications = pubs => {
  // newer ids first
  return pubs.sort((a, b) => b.id - a.id);
};

const storePublicationsInCache = pubs => {
  pubs.forEach(pub => pubCache.set(pub.id, pub));

  return pubs;
};

const getPublications = (pubmedIds) => {
  let isCached = id => pubCache.has(id);
  let cachedIds = pubmedIds.filter(isCached);
  let uncachedIds = pubmedIds.filter(id => !isCached(id));

  let cachedPubs = cachedIds.map(id => pubCache.get(id));

  let getMergedResult = fetchedPubs => sortPublications(cachedPubs.concat(fetchedPubs));

  if( uncachedIds.length === 0 ){
    return Promise.resolve( getMergedResult([]) ); // no fetched pubs
  }

  let body = new URLSearchParams();

  body.append('tool', 'PathwayCommons');
  body.append('email', 'gary.bader@utoronto.ca');
  body.append('db', 'pubmed');
  body.append('retmode', 'json');
  body.append('id', uncachedIds.join(','));

  return (
    fetch(`${NCBI_EUTILS_BASE_URL}/esummary.fcgi`, { method: 'POST', body })
      .then(res => res.json())
      .then(processPublications)
      .then(storePublicationsInCache)
      .then(getMergedResult)
  );
};

//Could cache somewhere here.
const fetchByGeneIds = ( geneIds ) => {
  return fetch(`${NCBI_EUTILS_BASE_URL}/esummary.fcgi?retmode=json&db=gene&id=${geneIds.join(',')}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .catch( error => {
      logger.error(`${error.name} in ncbi fetchByGeneIds: ${error.message}`);
      throw error;
    });
};

const getEntitySummary = async ( uids ) => {

  const summary = {};
  if ( _.isEmpty( uids ) ) return summary;

  const results = await fetchByGeneIds( uids );
  const result = results.result;

  result.uids.forEach( uid => {
    if( _.has( result, uid['error'] ) ) return;
    const doc = result[ uid ];
    const xref = {};

    // Fetch external database links first
    if ( _.has( doc, 'name' ) ){
      xref[DATASOURCES.HGNC] = _.get( doc, 'name' ,'');
      xref[DATASOURCES.GENECARDS] = _.get( doc, 'name', '');
    }

    const eSummary = new EntitySummary({
      dataSource: DATASOURCES.NCBIGENE,
      displayName: _.get( doc, 'description', ''),
      localID: _.get( doc, 'uid', ''),
      description: _.get( doc, 'summary', ''),
      aliases: _.get( doc, 'otherdesignations', '').split('|'),
      aliasIds: _.get( doc, 'otheraliases', '').split(',').map( a => a.trim() ),
      xref: xref
    });

    return summary[ uid ] = eSummary;
  });

  return summary;
};

module.exports = { getPublications, getEntitySummary };
