const failOnBadStatus = res => {
  if(!res.ok){
    throw new Error(`Fetch failed due to bad status code : ${res.statusText} : ${res.url}`);
  } else {
    return res;
  }
};

const safeFetch = function(url, options){
  return fetch(url, options).then(failOnBadStatus);
};

module.exports = safeFetch;
