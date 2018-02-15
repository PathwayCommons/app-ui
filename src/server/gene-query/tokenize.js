const _ = require('lodash');

const tokenize = function(input) {
  // interpret \n, \r\n from endpoint as string literals
  // const result = input.split(/(\\r)?\\n/).filter(String);
  // _.forEach(result, function(elem){
  //   if (elem == undefined) {
  //     _.pull(result, elem);
  //   }
  // });

  // or use other delimiters
  const result = input.split(/ +/).filter(String);
  return result;
};

module.exports = tokenize;