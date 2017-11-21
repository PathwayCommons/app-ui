let fetch = require('node-fetch');
let qs = require('querystring');

//Traverse Options
const fetchOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

function get(options) {
  //Construct query url
  let url = 'https://www.pathwaycommons.org/pc2/get?' + qs.stringify(options);
  return fetch(url, fetchOptions).then(response => response.text());
}

//Queries PC2 using traverse
//Returns metadata for the pathway
//Requires a valid query and uri
function traverse(options) {
  //Construct query url
  let url = 'https://www.pathwaycommons.org/pc2/traverse?' + qs.stringify(options);
  return fetch(url, fetchOptions).then(response => response.json());
}

function search(options) {
  //Construct query url
  let url = 'https://www.pathwaycommons.org/pc2/search?' + qs.stringify(options); 
  return fetch(url, fetchOptions).then(response => response.json());
}

function graph(options) {
  //Construct query url
  let url = 'https://www.pathwaycommons.org/pc2/graph?' + qs.stringify(options); 
  return fetch(url, fetchOptions).then(response => response.json());
}

function top_pathways(options) {
  //Construct query url
  let url = 'https://www.pathwaycommons.org/pc2/top_pathways?' + qs.stringify(options); 
  return fetch(url, fetchOptions).then(response => response.json());
}

//Export Functions
module.exports = {
  get,
  traverse,
  graph,
  top_pathways,
  search
};

