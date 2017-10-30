const {search, utilities} = require('pathway-commons');

const getHGNCData = require('./hgnc');

const removeSpaces = (token) => {
  return token.replace(/(\s+)/g, '\\$1');
};

const processPhrase = (phrase, collection) => {
  const sourceList = [
    'uniprot',
    'chebi',
    'smpdb',
    'refseq'
  ];

  const tokens = phrase.split(/\s+/g);

  return tokens
    .map(token => {
      //if symbol is recognized by at least one source
      const tokenRecognized = sourceList.some(source => utilities.sourceCheck(source, token))
      || collection.has(token.toUpperCase());
      const luceneToken = token.replace(/([\!\*\+\-\&\|\(\)\[\]\{\}\^\~\?\:\/\\"])/g, '\\$1');

      return tokenRecognized ? ( 'xrefid:' + luceneToken ) : ( 'name:' + '*' + luceneToken + '*' );
    });
};

const processQueryString =  queryString => {
  return getHGNCData('hgncSymbols.txt')
    .then(hgncSymbols => {
      const processedTokens = processPhrase(queryString, hgncSymbols);

      // return three query candidates to search, first query is fastest, last query slowest
      return [
        '(name:' + removeSpaces(queryString) + ') OR (' + 'name:*' + removeSpaces(queryString) + '*) OR (' + processedTokens.join(' AND ') + ')',
        '(' + processedTokens.join(' OR ') + ')',
        queryString
      ];
    });
};

// needs query object with the following values:
//  - q: string to search
//  - type: the type of bioPAX class to get
//  - lt: max graph size result returned
//  - gt: min graph size result returned

const querySearch = async (query) => {
  const processedQueries = await processQueryString(query.q.trim());

  for (let pq of processedQueries) {
    const searchResult = await search()
      .query(query)
      .q(pq)
      .format('json')
      .fetch();

    if (searchResult.searchHit.length > 0) {
      const minResultSize = query.gt || 250;
      const maxResultSize = query.lt || 3;

      const filteredResults = searchResult.searchHit.filter(hit => {
        const resultSize = hit.numParticipants ? hit.numParticipants : 0;
        return minResultSize < resultSize && resultSize < maxResultSize;
      });

      return filteredResults;
    }
  }

  return [];
};

module.exports = querySearch;
