const pc = require('pathway-commons');
const _ = require('lodash');
const qs = require('querystring');
const fetch = require('node-fetch');

const search = require('./search/');
const datasources = require('./datasources');


const fetchOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const PathwayCommonsService = {
  // query pathway commons for pathways, sbgn, information, etc.
  query (uri, format, path=null) {
    let query;
    if (path != null) {
      query = pc.traverse();
      query.path(path);
    } else {
      query = pc.get();
    }

    return query
      .uri(uri)
      .format(format)
      .fetch();
  },

  // id the app as a user of pathwaycommons
  registerUser (name) {
    pc.utilities.user(name);
  },

  // check if pathway commons is online
  isServiceOnline (delay) {
    return pc.utilities.pcCheck(delay);
  },

  get(options) {
    //Construct query url
    let url = 'https://www.pathwaycommons.org/pc2/get?' + qs.stringify(options);
    return fetch(url, fetchOptions).then(response => response.text());
  },
  
  //Queries PC2 using traverse
  //Returns metadata for the pathway
  //Requires a valid query and uri
  traverse(options) {
    //Construct query url
    let url = 'https://www.pathwaycommons.org/pc2/traverse?' + qs.stringify(options);
    return fetch(url, fetchOptions).then(response => response.json());
  },
  
  search(options) {
    //Construct query url
    let url = 'https://www.pathwaycommons.org/pc2/search?' + qs.stringify(options); 
    return fetch(url, fetchOptions).then(response => response.json());
  },
  
  graph(options) {
    //Construct query url
    let url = 'https://www.pathwaycommons.org/pc2/graph?' + qs.stringify(options); 
    return fetch(url, fetchOptions).then(response => response.json());
  },
  
  top_pathways(options) {
    //Construct query url
    let url = 'https://www.pathwaycommons.org/pc2/top_pathways?' + qs.stringify(options); 
    return fetch(url, fetchOptions).then(response => response.json());
  }
};

PathwayCommonsService.querySearch = _.memoize(search.querySearch, query => JSON.stringify(query));
PathwayCommonsService.uniprotIdSearch = _.memoize(search.uniprotIdSearch, query => JSON.stringify(query));
PathwayCommonsService.datasources = _.memoize(datasources);

// expose core cpath2 client api
PathwayCommonsService.core = pc;

module.exports = PathwayCommonsService;