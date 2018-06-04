const formatContent = require('./format-content');

/**
 * fetchPubMedPublication(id)
 * @param id A publication id formatted as a string
 * @returns Publication JSON
 * @description Fetches Publication Json from PubMed
 */
function fetchPubMedPublication(id) {
  const options = {
    method: 'GET',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const urlPrefix = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=';
  return fetch(urlPrefix + id.toString(), options).then(res => res.json());
}


/**
 * processPublicationData(data)
 * @param data Publication JSON
 * @returns Array of Objects
 * @description Parses the publication json from PubMed and extracts relevant information
 */

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

/**
 * getPublications(data)
 * @param data A node metadata array
 * @returns Array of Pairs
 * @description Gets publication titles, references, and authors from PubMed
 */
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

  if(data && databaseInfo !== [])
    data.push([["Database IDs"],databaseInfo]);

  return new Promise(function (resolve, reject) {
    if (!(data)) { resolve(data); }

    //Check if publication data already exists
    const existingData = data.filter(pair => pair[0] == 'Publications');
    if (existingData.length > 0) { resolve(data); }

    //Get Database Ids
    const databaseIds = data.filter(pair => pair[0] == 'Database IDs')[0];
    if (!(databaseIds)) { resolve(data); }

    //Get PubMed References
    const sorted = formatContent.sortByDatabaseId(databaseIds[1]);
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