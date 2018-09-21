const fetch = require('node-fetch');
const { NCBI_EUTILS_BASE_URL, PUB_CACHE_MAX_SIZE } = require('../../config');
const { URLSearchParams } = require('url');
const LRUCache = require('lru-cache');

const pubCache = LRUCache({ max: PUB_CACHE_MAX_SIZE, length: () => 1 });

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

module.exports = { getPublications };
