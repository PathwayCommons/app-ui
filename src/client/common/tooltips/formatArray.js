const _ = require('lodash');

/**
 * collectionToBottom(data, criteriaList)
 * @param data An array of keyed pairs
 * @param criteriaList An array of keys that need to be push to the bottom
 * @returns Array
 * @description Pushes a collection of pairs to the bottom of the list
 * Sample Input : collectionToBottom([['1', 'a'], ['2', 'b']], ['1'])
 * Sample Output : [['2', 'b'], ['1', 'a']]
 */
function collectionToBottom(data, criteriaList) {
  if(!(data)) {return [];}
  const matched = data.filter(pair => criteriaList.includes(pair[0]));
  const notMatched = _.difference(data, matched);
  return notMatched.concat(_.sortBy(matched, pair => criteriaList.indexOf(pair[0])));
}

/**
 *
 * @param data An array of keyed pairs
 * @param criteriaList An array of keys that need to be push to the bottom
 * @returns Array
 * @description Pushes a collection of pairs to the top of the list
 * Sample Input : collectionToBottom([['1', 'a'], ['2', 'b']], ['2'])
 * Sample Output : [['2', 'b'], ['1', 'a']]
 */
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