const qs = require('querystring');
const fetch = require('node-fetch');
const _ = require('lodash');

const config = require('../../config');
const geneValidator = require('../enrichment/validation').validatorGconvert;


const fetchOptions = {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const _sanitize = (s) => {
  // Escape (with '\'), to treat them literally, symbols, such as '*', ':', or space,
  // which otherwise play special roles in a Lucene query string.
  return s.replace(/([!*+\-&|()[\]{}^~?:/\\"\s])/g, '\\$1');
};

const _processPhrase = (phrase) => {
  return geneValidator(phrase.split(' '),{}).then(result => {
    const genes = result.geneInfo.map(gene=>'xrefid:' + _sanitize(gene.initialAlias.toUpperCase()));
    const otherIds = result.unrecognized.map(id=>{
      id=id.toUpperCase();
      const recognized = /^SMP\d{5}$/.test(id) // check for a smpdb or chebi id
        ||/^CHEBI:\d+$/.test(id) && (id.length <= ("CHEBI:".length + 6));
      const sanitized = _sanitize(id);
      return recognized ? ( 'xrefid:' + sanitized ) : ( 'name:' + '*' + sanitized + '*' );
    });
    return genes.concat(otherIds);
  });
};

const _processQueryString = (inputString) => {
  const keywords = _processPhrase(inputString);
  const phrase = _sanitize(inputString);
  // return three search query candidates: the first one is the fastest, the last - slowest
  return [
    '(name:' + phrase + ') OR (' + 'name:*' + phrase + '*) OR (' + keywords.join(' AND ') + ')',
    '(' + keywords.join(' OR ') + ')',
    inputString //"as is" (won't additionally escape Lucene query syntax, spaces, etc.)
  ];
};

//Pathway Commons HTTP GET request; options.cmd = 'get', 'search', 'traverse', 'graph', etc.
const query = (queryObj) => {
  queryObj.user = name;
  let cmd = queryObj.cmd.toLowerCase() | 'get';
  delete queryObj['cmd'];
  let url = config.PC_URL+cmd + ((cmd=='graph') ? '' : '?' + qs.stringify(queryObj));
  // try later:
  // const fo = (cmd=='graph') ? {method: 'POST', body: JSON.stringify(queryObj)} : fetchOptions;
  return fetch(url, fetchOptions).then(response => (cmd=='get'||cmd=='graph') ? response.text() : response.json());
};

// A fine-tuned PC search to improve relevance of full-text search and filter out unwanted hits.
// The argument (query object) has the following fields:
//  - q: user input - search query string
//  - type: BioPAX type to match/filter by
//  - lt: max graph size result returned
//  - gt: min graph size result returned
const _querySearch = (args) => {
  const minSize = args.gt || 0;
  const maxSize = args.lt || 250;
  // delete query.gt; delete query.lt;
  //analyse the input string, generate specific (lucene) search sub-queries
  const queryString = args.q.trim();
  const queries = _processQueryString(queryString);
  args.cmd = 'search'; //set PC ws command
  for (let q of queries) {
    args.q = q; //override initial query.q string with the sub-query q
    const searchResult = query(args); //up to 100 hits at once; if we need more, then must use 'page' parameter...
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

//PC pathway data sources
const _datasources = () => {
  return fetch(config.PC_URL + 'metadata/datasources', fetchOptions)
  .then(res => res.json())
  .then(array => {
    // console.log('datasources() - ' + array); //TODO remove
    const output = {};
    array.filter(source => source.notPathwayData == false).map(ds => {
      var name = (ds.name.length > 1) ? ds.name[1] : ds.name[0];
      output[ds.uri] = {
        id: ds.identifier,
        uri: ds.uri,
        name: name,
        description: ds.description,
        type: ds.type,
        iconUrl: ds.iconUrl
      };
    });
    return output; //filtered, simplified map
  })
  .catch((e) => {
    // console.log('datasources() ERROR - ' + e); //TODO remove
    return null;
  });
};

//cached functions
const datasources = _.memoize(_datasources);
const querySearch = _.memoize(_querySearch, query => JSON.stringify(query));

//PC pathway data sources
const metadata = () => {
  const meta = {};
  meta.version = query({cmd:'traverse', path: 'Named/name', uri: "" }).then((json) => json.version);
  return meta; //TODO: get more metadata in the future (configuration, name, desc., logo, etc.)
};

module.exports = {query, querySearch, datasources, metadata};