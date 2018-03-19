const {search, utilities} = require('pathway-commons');
const path = require('path');
const _ = require('lodash');
const geneValidator = require('../../enrichment-map/gene-validator/index').validatorGconvert;

const sanitize = (s) => {
  // Escape (with '\'), to treat them literally, symbols, such as '*', ':', or space, 
  // which otherwise play special roles in a Lucene query string.
  return s.replace(/([\!\*\+\-\&\|\(\)\[\]\{\}\^\~\?\:\/\\"\s])/g, '\\$1')
};

const processPhrase = (phrase) => {
  return geneValidator(phrase).then(result => {
    const genes = result.geneInfo.map(gene=>'xrefid:' + sanitize(gene.initialAlias.toUpperCase()));
    const otherIds = result.unrecogized.map(id=>{
      id=id.toUpperCase()
      const recognized = /^SMP\d{5}$/.test(id)     // check for a smpdb or chebi id 
                      ||/^CHEBI:\d+$/.test(id) && (id.length <= ("CHEBI:".length + 6));      
      const sanitized = sanitize(id);
      return recognized ? ( 'xrefid:' + sanitized ) : ( 'name:' + '*' + sanitized + '*' );
    }); 
    return genes.concat(otherIds);  
  });
};

const processQueryString = async (queryString) => {
  const keywords = await processPhrase(queryString);
  const phrase = sanitize(queryString);
  // return three query candidates to search, first query is fastest, last query slowest
  return [
    '(name:' + phrase + ') OR (' + 'name:*' + phrase + '*) OR (' + keywords.join(' AND ') + ')',
    '(' + keywords.join(' OR ') + ')',
    queryString //"as is" (Lucene query syntax enabled)
  ];
};

// needs query object with the following values:
//  - q: string to search
//  - type: the type of bioPAX class to get
//  - lt: max graph size result returned
//  - gt: min graph size result returned

const querySearch = async (query) => {
  const minSize = query.gt || 0; //TODO: why 250? 
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
        return minSize < size && size < maxSize;
      });
      if (filteredResults.length > 0) {
        return filteredResults;
      }
    }
  }

  return [];
};

const uniprotIdSearch = async (query) => {
  const queries = await (processPhrase(sanitize(query.q.trim())));
  const filteredQueries = queries.filter(entry=>entry.includes('xrefid'));
  if(!_.isEmpty(filteredQueries)){
    const searchResult = await search()
      .query(query) //input query string
      .q(filteredQueries)
      .format('json')
      .fetch();
    const searchSuccess = searchResult != null
    if (searchSuccess && searchResult.searchHit.length > 0) {
      const filteredResults = searchResult.searchHit.filter(hit =>
        hit.uri.startsWith('http://identifiers.org/uniprot/') 
      );
      return filteredResults.map(hit=>_.last(hit.uri.split('/'))); //Parses and returns the Uniprot id
    }
  } 
  return [];
};
module.exports = {querySearch:querySearch,uniprotIdSearch:uniprotIdSearch};