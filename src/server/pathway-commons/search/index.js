const {search, utilities} = require('pathway-commons');
const path = require('path');
const getHGNCData = require('./hgnc');

const sanitize = (s) => {
  // Escape (with '\'), to treat them literally, symbols, such as '*', ':', or space, 
  // which otherwise play special roles in a Lucene query string.
  return s.replace(/([\!\*\+\-\&\|\(\)\[\]\{\}\^\~\?\:\/\\"\s])/g, '\\$1')
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
      const recognized = sourceList.some(source => utilities.sourceCheck(source, token))
                              || collection.has(token.toUpperCase());
      const sanitized = sanitize(token);
      return recognized ? ( 'xrefid:' + sanitized ) : ( 'name:' + '*' + sanitized + '*' );
    });
};

const processQueryString = (queryString) => {
  return getHGNCData(path.join(__dirname,'/hgncSymbols.txt'))
    .then(hgncSymbols => {
      const keywords = processPhrase(queryString, hgncSymbols);
      const phrase = sanitize(queryString);
      // return three query candidates to search, first query is fastest, last query slowest
      return [
        '(name:' + phrase + ') OR (' + 'name:*' + phrase + '*) OR (' + keywords.join(' AND ') + ')',
        '(' + keywords.join(' OR ') + ')',
        queryString //"as is" (Lucene query syntax enabled)
      ];
    });
};

// needs query object with the following values:
//  - q: string to search
//  - type: the type of bioPAX class to get
//  - lt: max graph size result returned
//  - gt: min graph size result returned

const querySearch = async (query) => {
  const minSize = query.gt || 1; //TODO: why 250? 
  const maxSize = query.lt || 250;
 
  const queries = await processQueryString(query.q.trim());
  for (let q of queries) {
    const searchResult = await search()
      .query(query) //input query string
      .q(q)
      .format('json')
      .fetch();
    
    const searchSuccess = searchResult != null;
    if (searchSuccess && searchResult.searchHit.length > 0) {
      const filteredResults = searchResult.searchHit.filter(hit => {
        const size = hit.numParticipants ? hit.numParticipants : 0;
        return minSize <= size && size < maxSize;
      });
      if (filteredResults.length > 0) {
        return filteredResults;
      }
    }
  }

  return [];
};

module.exports = querySearch;
