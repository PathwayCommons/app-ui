const { fetch } = require('../../util');
const { cache } = require('../cache');
const {
  NCBI_EUTILS_BASE_URL,
  PUB_CACHE_MAX_SIZE,
  NS_GENECARDS,
  NS_HGNC_SYMBOL,
  NS_NCBI_GENE,
  NCBI_API_KEY,
  IDENTIFIERS_URL,
  ENT_CACHE_MAX_SIZE,
  ENT_SUMMARY_CACHE_MAX_SIZE } = require('../../config');
const { URLSearchParams } = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');
const qs = require('query-string');
const { EntitySummary } = require('../../models/entity/summary');
const logger = require('../logger');

const pubCache = new QuickLRU({ maxSize: PUB_CACHE_MAX_SIZE });
const entCache = new QuickLRU({ maxSize: ENT_CACHE_MAX_SIZE });
const entSummaryCache = new QuickLRU({ maxSize: ENT_SUMMARY_CACHE_MAX_SIZE });

const authParams = {
  tool: 'PathwayCommons',
  email: 'pathway-commons-dev@googlegroups.com',
  api_key: NCBI_API_KEY
};

const ncbiRequest = ( url, opts ) => {
  let { query, body } = opts;

  if( query != null ){
    _.assign( query, authParams );
    url += '?' + qs.stringify( query );
  } else {
    Object.entries( authParams ).forEach( entry => {
      let [ k, v ] = entry;
      body.append(k, v);
    } );
  }

  return fetch( url, opts );
};

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

  body.append('db', 'pubmed');
  body.append('retmode', 'json');
  body.append('id', uncachedIds.join(','));

  return (
    ncbiRequest(`${NCBI_EUTILS_BASE_URL}/esummary.fcgi`, { method: 'POST', body })
      .then(res => res.json())
      .then(processPublications)
      .then(storePublicationsInCache)
      .then(getMergedResult)
  );
};

const sortEnts = ents => {
  // newer ids first
  return ents.sort((a, b) => parseInt(b.id) - parseInt(a.id));
};

const storeEntsInCache = ents => {
  ents.forEach(ent => entCache.set(ent.id, ent));

  return ents;
};

const fetchByGeneIds = ( geneIds ) => {
  let isCached = id => entCache.has(id);
  let cachedIds = geneIds.filter(isCached);
  let uncachedIds = geneIds.filter(id => !isCached(id));

  let cachedEnts = cachedIds.map(id => entCache.get(id));

  let getMergedResult = fetchedEnts => sortEnts(cachedEnts.concat(fetchedEnts));

  let fetchUncachedEnts = () => (
    ncbiRequest(`${NCBI_EUTILS_BASE_URL}/esummary.fcgi`,
    {
      query: {
        retmode: 'json',
        db: 'gene',
        id: uncachedIds.join(',')
      },
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .then(res => res.result.uids.map(uid => res.result[uid]))
  );

  return (
    Promise.resolve()
    .then(fetchUncachedEnts)
    .then(storeEntsInCache)
    .then(getMergedResult)
    .catch( error => {
      logger.error(`${error.name} in ncbi fetchByGeneIds: ${error.message}`);
      throw error;
    })
  );
};

const createUri = ( namespace, localId ) => IDENTIFIERS_URL + '/' + namespace + '/' + localId;

const rawMakeSummary = (ent) => {
  const xrefLinks = [];

  const uid = ent.uid;

  // Fetch external database links first
  const localId = _.get( ent, 'name');
  if( localId ){
    [ NS_HGNC_SYMBOL, NS_GENECARDS ].forEach( namespace => {
      xrefLinks.push({
        "namespace": namespace,
        "uri": createUri( namespace, localId )
      });
    });
  }
  // push in NCBI xrefLink too
  xrefLinks.push({
    "namespace": NS_NCBI_GENE,
    "uri": createUri( NS_NCBI_GENE, uid )
  });

  const eSummary = new EntitySummary({
    namespace: NS_NCBI_GENE,
    displayName: _.get( ent, 'description', ''),
    localId: uid,
    description: _.get( ent, 'summary', ''),
    aliases: _.get( ent, 'otherdesignations', '').split('|'),
    aliasIds: _.get( ent, 'otheraliases', '').split(',').map( a => a.trim() ),
    xrefLinks: xrefLinks
  });

  return eSummary;
};

const makeSummary = cache(rawMakeSummary, entSummaryCache, ent => parseInt(ent.uid));

const getEntitySummary = async ( uids ) => {

  if ( _.isEmpty(uids) ) return [];

  const ents = await fetchByGeneIds( uids );

  return ents.map(makeSummary);
};

module.exports = { getPublications, getEntitySummary };
