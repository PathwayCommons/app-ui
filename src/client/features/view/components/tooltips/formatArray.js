const _ = require('lodash');

//Push a metadata field to the bottom of the list
function pushToBottom(data, field) {
  let withoutField = _.filter(data, pair => pair[0] !== field);
  let withField = _.filter(data, pair => pair[0] === field);
  return _.concat(withoutField, withField);
}

//Order a given metadata data array
function orderArray(data) {
  let filterList = ['Database IDs', 'Comment'];
  filterList.forEach(field => data = pushToBottom(data, field));
  return data;
}

module.exports = {
  pushToBottom,
  orderArray
};