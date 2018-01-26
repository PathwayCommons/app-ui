const tokenize = function(input) {
  return input.split(/\r?\n/).filter(String);
};


module.exports = tokenize;