const _ = require('lodash');
const generate = require('./generateContent');

//Fetch Publications XML from PubMed
function fetchPubMedPublication(id) {
  const options = {
    method: 'GET',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const urlPrefix = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=';
  return fetch(urlPrefix + id.toString(), options).then(res => res.json());
}


//Process an array of publication data into human readable links
//Array -> HTML
function processPublicationData(data){
  const result = data.result
  if(!(result)) { return null;}
  const uids = result.uids;

  //Loop through a database ids
  let extractedData = uids.map(uid => {
    const publicationData = result[uid];
    return {
      title : publicationData.title,
      authors : publicationData.authors
    };
  });

  console.log(extractedData);
}

//Get publication titles and references
//Metadata -> HTML
function getPublications(data) {
  //Get Database Ids
  const databaseIds = data.filter(pair => pair[0] == 'Database IDs')[0];
  if (!(databaseIds)) { return null; }

  //Get PubMed References
  const sorted = generate.sortByDatabaseId(databaseIds[1]);
  const pubMedReferences = sorted.filter(item => item.database.toUpperCase() === 'PUBMED');
  if (!(pubMedReferences) || pubMedReferences.length === 0) { return null; }

  const pubMedIds = pubMedReferences[0].ids;
  let promiseArray = [];

  //Get publication data in bulk and process publication data
  fetchPubMedPublication(pubMedIds).then(data => processPublicationData(data));
}
 

module.exports = getPublications;