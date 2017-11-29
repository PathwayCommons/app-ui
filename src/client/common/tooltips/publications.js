const _ = require('lodash');
const generateContent = require('./generateContent');

//Fetch Publications XML from PubMed
//String -> JSON
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
//Array -> Array
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

//Get publication titles and references
//Array -> Metadata Array
function getPublications(data) {

  return new Promise(function (resolve, reject) {
    if (!(data)) { resolve(data); }

    //Check if publication data already exists
    const existingData = data.filter(pair => pair[0] == 'Publications');
    if (existingData.length > 0) { resolve(data); }

    //Get Database Ids
    const databaseIds = data.filter(pair => pair[0] == 'Database IDs')[0];
    if (!(databaseIds)) { resolve(data); }

    //Get PubMed References
    const sorted = generateContent.sortByDatabaseId(databaseIds[1]);
    const pubMedReferences = sorted.filter(item => item.database.toUpperCase() === 'PUBMED');
    if (!(pubMedReferences) || pubMedReferences.length === 0) { resolve(data); }

    const pubMedIds = pubMedReferences[0].ids;

    //Get publication data in bulk and process publication data
    return fetchPubMedPublication(pubMedIds).then(publications => {
      data.push(['Publications', processPublicationData(publications)]);
      resolve(data);
    }).catch(() => resolve(data));
  });

}


module.exports = getPublications;