const {search} = require('pathway-commons');

// all datasources that return pathways
const valid_datasources = [
  'reactome',
  'pid',
  'humancyc',
  'panther',
  'kegg',
  'smpdb',
  'inoh',
  'netpath',
  'wikipathways'
];

// todo
// - return a list of search results instead of the whole search result
// create a better algorithm that needs to:
//  1. get a list of hits up to some max reasonable number (e.g 150 hits)
//  2. there are three methods of searching contained in queryProcessor.js
//     run each search method until you have $MAX_HITS, combine the results and
//     return them
//
// the reason why this needs to be done is that pc2 only returns 100 hits at a time per search query,
// most of them have some hits that are empty and there is no option to filter by hit size
// therefore, multiple search methods must be used to build a list of $MAX_HITS size

const querySearch = (query) => {
  const queryValue = query.q;

  return search()
    .query(query)
    .q(queryValue)
    .datasource(valid_datasources)
    .format('json')
    .fetch()
    .then(searchResult => {
      const minResultSize = query.gt || 250;
      const maxResultSize = query.lt || 3;

      const filteredResults = searchResult.searchHit.filter(hit => {
        const resultSize = hit.numParticipants ? hit.numParticipants : 0;
        return minResultSize < resultSize && resultSize < maxResultSize;
      });

      searchResult.searchHit = filteredResults;

      return searchResult;
    });
};

module.exports = querySearch;