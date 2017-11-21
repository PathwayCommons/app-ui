const _ = require('lodash');

//Push a collection of elements to the bottom of the list
//Takes in a list of id's and pushes all matching items to the bottom of the list
//Requires a valid list of ids
function collectionToBottom(data, criteriaList) {
  if(!(data)) {return [];}
  const matched = data.filter(pair => criteriaList.includes(pair[0]));
  const notMatched = _.difference(data, matched);
  return notMatched.concat(_.sortBy(matched, pair => criteriaList.indexOf(pair[0])));
}

//Push a collection of elements to the top of the list
//Takes in a list of id's and pushes all matching items to the bottom of the list
//Requires a valid list of ids
function collectionToTop(data, criteriaList) {
  if(!(data)) {return [];}
  const matched = data.filter(pair => criteriaList.includes(pair[0]));
  const notMatched = _.difference(data, matched);
  return _.sortBy(matched, pair => criteriaList.indexOf(pair[0])).concat(notMatched);
}

module.exports = {
  collectionToBottom,
  collectionToTop
};