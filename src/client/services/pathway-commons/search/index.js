const lodash = require('lodash');
const {search, datasources} = require('pathway-commons');

const processQuery = require('./queryProcessor');


export default lodash.memoize((query, failureCount) => {
  failureCount = typeof failureCount === 'number' ? failureCount : 0;
  return processQuery(query, failureCount) // Get processed q using processQuery
    .then(processedQuery => { // Peform fetch using pathway-commons
      if(processedQuery == null) { // Check for processQuery failure
        // Force failure and signal break recursion
        failureCount = -1;
        throw new Error();
      }
      return Promise.all([
        search()
          .query(query)
          .q(processedQuery)
          .format('json')
          .fetch(),
        datasources.fetch()
      ]);
    })
    .then(promiseArray => { // Perform filtering and throw error if no valid results returned
      var searchObject = promiseArray[0];
      var datasources = promiseArray[1];
      if(searchObject == null || (typeof searchObject === 'object' && searchObject.empty === true)) { // Check for no returned results
        throw new Error();
      }

      searchObject.searchHit = searchObject.searchHit.filter(item => { // Perform filtering by numParticipants
        if(((query.lt > item.numParticipants) || query.lt === undefined) && ((query.gt < item.numParticipants) || query.gt === undefined)) {
          return true;
        }
        else {
          return false;
        }
      });

      if(searchObject.searchHit.length > 0) { // Process searchData to add extra properties from dataSources
        return {
          searchHit: searchObject.searchHit.map(searchResult => {
            searchResult['sourceInfo'] = datasources[searchResult.dataSource[0]];
            return searchResult;
          }),
          ...searchObject
        };
      }
      else { // Assume filtering has removed all search hits
        throw new Error();
      }
    })
    .catch(() => {
      if(lodash.isEmpty(query)) { // Invalid object passed in
        return Promise.resolve(undefined);
      }
      if(failureCount !== -1) { // Advance failureCount and recurse
        return processQuery(query, failureCount + 1);
      }
      else { // Break recursion and return null
        return Promise.resolve(null);
      }
    });
});
