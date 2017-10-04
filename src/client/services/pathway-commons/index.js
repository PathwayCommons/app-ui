const pc = require('pathway-commons');
const _ = require('lodash');

const search = require('./search/');
const validDataSources = require('./datasources');

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
  
  datasources () {
    return validDataSources;
  },

  lookupDataSourceIcon (datasourceIdString) {
    return _.find(validDataSources, datasource => {
      return datasource.id === datasourceIdString;
    }).iconUrl;
  },

  querySearch (query) {
    return search(query, validDataSources.map(ds => ds.id));
  } 
};

// expose core cpath2 client api
PathwayCommonsService.core = pc;

module.exports = PathwayCommonsService;