const _ = require('lodash');

//Push a metadata field to the bottom of the list
function pushToBottom(data, field) {
  let withoutField = _.filter(data, pair => pair[0] !== field);
  let withField = _.filter(data, pair => pair[0] === field);
  return _.concat(withoutField, withField);
}

//Push a collection of elements to the bottom of the list
//Takes in a list of id's and pushes all matching items to the bottom of the list
//Requires a valid list of ids
function collectionToBottom(data, idList) {
  idList.forEach(field => data = pushToBottom(data, field));
  return data;
}

module.exports = {
  pushToBottom,
  collectionToBottom
};