const tokenize = (query) => {
  // interpret \n, \r\n from endpoint as string literals
  // const result = input.split(/(\\r)?\\n/).filter(String);
  // _.forEach(result, function(elem){
  //   if (elem == undefined) {
  //     _.pull(result, elem);
  //   }
  // });

  // or use other delimiters
  const result = query.split(/ +/).filter(String);
  return result;
};

module.exports = {tokenize};