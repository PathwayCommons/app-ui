/**
    Pathway Commons Central Data Cache

    File Downloader
    fileDownloader.js

    Purpose : Downloads SBGN, BioPax, Title, and Metadata files from PC2

    Requires : Valid URI's

    Effects : Downloads files asynchronously

    Note : Script may take time to download from pc2, due to uptime issues

    @author Harsh Mistry
    @version 1.1 2017/10/10
**/

var fetch = require('node-fetch');

//Traverse Options
const traverseOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

//Traverse Options
const getOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'text',
  }
};

//Returns the request file from pathway commons
//Requires uri and format to be valid xml files
function getPC2(uri, format) {
  //Construct query url
  var uri = encodeURIComponent(uri);
  var url = 'https://www.pathwaycommons.org/pc2/get?format=' + format + '&uri=' + uri + '&user=pathwaycommons-js-lib%3Apathways-search';
  return fetch(url, getOptions).then(response => response.text());
}

//Queries PC2 using traverse
//Returns metadata for the pathway
//Requires a valid query and uri
function traversePC2(uri, path) {
  //Construct query url
  uri = encodeURIComponent(uri);
  path = encodeURIComponent(path);
  var url = 'https://www.pathwaycommons.org/pc2/traverse?format=json&uri=' + uri + '&path=' + path;
  return fetch(url, traverseOptions).then(response => response.json());
}

//Generate URL for getting data
function getURL (uri, format){
  var uri = encodeURIComponent(uri);
  var url = 'https://www.pathwaycommons.org/pc2/get?format=' + format + '&uri=' + uri + '&user=pathwaycommons-js-lib%3Apathways-search';
  return url;
}

//Generate URL for a traverse query
function traverseURL(uri, path){
  var uri = encodeURIComponent(uri);
  var url = 'https://www.pathwaycommons.org/pc2/traverse?format=json&uri=' + uri + '&path=' + path;
  return url;
}

//Export Functions
module.exports = {
  getPC2: getPC2,
  traversePC2: traversePC2,
  getURL : getURL,
  traverseURL : traverseURL
}

