const _ = require('lodash');

const { databases } = require('../../common/config');
const { ServerAPI } = require('../../services');



// LEGACY CODE BEGIN
function processPublicationData(data) {
  const result = data.result;
  if (!(result)) { return null; }
  const uids = result.uids;

  //Loop through a database ids
  let extractedData = uids.map(uid => {
    const publicationData = result[uid];
    return {
      id: uid,
      title: publicationData.title,
      authors: publicationData.authors,
      firstAuthor : publicationData.sortfirstauthor,
      date: publicationData.sortpubdate,
      source : publicationData.source
    };
  });

  return extractedData;
}


function sortByDatabaseId(dbArray) {
  //Sort by database name
  let sorted = [];
  let databases = _.groupBy(dbArray, entry => entry[0]);

  //Remove dbName from each entry
  _.forEach(databases, function (value, key) {
    databases[key] = _.map(databases[key], entry => entry[1]);
    sorted.push({ database: key, ids: databases[key] });
  });

  return sorted;
}

function getPublications(data) {
  /*
  Sometimes the PubMed citation info gets loaded in as an element in the "List" part of the "data" array.
  It should be in the "Database IDs" section.
  This properly adds the citation info into "Database IDs", and removes the citation info from "List".
  */

  function checkForCitation(listItem){
      if(listItem[0] === "PubMed")
        return false;
      else
        return true;
  }

  let databaseInfo = [];
  for(let i in data){
    if(data[i][0] === "List"){
      for(let j in data[i][0]){
        if(data[i][1][j] && data[i][1][j][0] === "PubMed"){
          databaseInfo.push(["pubmed",data[i][1][j][1]]);
        }
      }
      data[i][1] = data[i][1].filter(checkForCitation);
    }
  }
  if(data && databaseInfo.length > 0)
    data.push([["Database IDs"],databaseInfo]);

  return new Promise(function (resolve) {
    if (!(data)) { resolve(null); }

    //Check if publication data already exists
    const existingData = data.filter(pair => pair[0] == 'Publications');
    if (existingData.length > 0) { resolve(null); }

    //Get Database Ids
    const databaseIds = data.filter(pair => pair[0] == 'Database IDs')[0];
    if (!(databaseIds)) { resolve(null); }

    //Get PubMed References
    const sorted = sortByDatabaseId(databaseIds[1]);
    const pubMedReferences = sorted.filter(item => item.database.toUpperCase() === 'PUBMED');
    if (!(pubMedReferences) || pubMedReferences.length === 0) { resolve(null); }

    const pubMedIds = _.get(pubMedReferences, '0.ids', []);

    //Get publication data in bulk and process publication data
    return ServerAPI.getPubmedPublications(pubMedIds).then(publications => {
      resolve(['Publications', processPublicationData(publications)]);
    }).catch(() => resolve(null));
  });

}

// LEGACY CODE END

// Node metadata should contain the following fields:
// 'Type',
// 'Standard Name',
// 'Display Name',
// 'Names',
// 'Database IDs',
// 'Publications'
// Publications are queried via pubmed using a network call

class PathwayNodeMetadata {
  constructor(node){
    let nodeMetadata = node.data('parsedMetadata');
    this.data = new Map(nodeMetadata);
    this.rawData = nodeMetadata;

    let determineSearchLinkQuery = (node, displayName) => {
      let nodeLabel = node.data('label');
      let nodeClass = node.data('class');
      return nodeClass === 'process' ? displayName : nodeLabel;
    };

    let processDbIds = rawDbIds => {
      let aggregatedDbIds = {};
      rawDbIds.forEach(dbEntry => {
        let [dbName, dbId ] = dbEntry;
        if( Object.keys(aggregatedDbIds).includes(dbName) ){
          aggregatedDbIds[dbName].push(dbId);
        } else {
          aggregatedDbIds[dbName] = [dbId];
        }
      });
      return aggregatedDbIds;
    };

    this.data.set('Label', node.data('label'));

    this.data.set('Publications', []);

    this.data.set('Search Link', determineSearchLinkQuery( node, this.data.get('Display Name')));

    this.data.set('Database IDs', new Map(Object.entries(processDbIds(this.databaseIds()))));
  }
  isEmpty(){
    return this.data.entries().length === 0;
  }
  type(){
    let type = this.data.get('Type');
    if( type ){
      return type.substring(3).replace(/([A-Z])/g, ' $1').trim();
    }
    return '';
  }
  label(){
    return this.data.get('Label') || '';
  }
  standardName(){
    return this.data.get('Standard Name') || '';
  }
  displayName(){
    return this.data.get('Display Name') || '';
  }
  synonyms(){
    let s = this.data.get('Names');
    if( typeof s === 'string' ){
      return [ s ];
    }
    if( Array.isArray(s) ){
      return s;
    }

    return [];
  }
  databaseIds(){
    return this.data.get('Database IDs') || [];
  }
  // for each database present in the metadata, reconstruct a link to that database
  // e.g { 'reactome', 'HSA-123' } => identifiers.org/reactome/HSA-123
  databaseLinks(){
    let dbEntries = this.databaseIds().entries();
    let findMatchingDb = dbId => {
      // Very bad hack, needs to be fixed from metadata generated from the server side
      let db =  databases.filter(db => db.database !== 'PubMed').find( entry => {
        return(
          entry.database.toUpperCase().includes(dbId.toUpperCase()) ||
          dbId.toUpperCase().includes(entry.database.toUpperCase())
        );
      });

      if( db ){
        return db;
      }

      return null;
    };

    let formattedUrls = [];
    [...dbEntries].forEach(([k, v]) => {
      let matchedDb = findMatchingDb(k);
      if( matchedDb != null ){
        if( Array.isArray(v) ){
          v.forEach( entityId => formattedUrls.push({ name: matchedDb.database, url: matchedDb.url + entityId } ));
        } else {
          formattedUrls.push({ name: matchedDb.database, url: matchedDb.url + v});
        }
      }
    });

    return formattedUrls;
  }
  publications(){
    return this.data.get('Publications') || [];
  }
  getPublicationData(){
    // append publications to the metadata model
    // todo why does this need to be fetched here, why can't it be done
    // at the time that the metadata is processed?
    let getRawPublications = async rawMetadata => {
      let pubs = await getPublications(rawMetadata);
      if( pubs != null ){
        return pubs[1];
      } else {
        return [];
      }
    };

    return getRawPublications(this.rawData).then( rawPubs => {
      this.data.set('Publications', rawPubs);
    });
  }
  searchLink(){
    return this.data.get('Search Link') || '';
  }
}

module.exports = PathwayNodeMetadata;