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