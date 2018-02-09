const tokenize = function(input) {
  //const result = input.split(/\r?\n/).filter(String);
  return input.split(/,/).filter(String);
};

module.exports = tokenize;