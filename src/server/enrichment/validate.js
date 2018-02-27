const request = require('request');
const _ = require('lodash');
const validateGp = function (query) {
  const promise = new Promise(function (resolve, reject) {
    const defaultSetting = {
      "output": "mini",
      "query": query
    };

    const formData = _.assign({}, defaultSetting);
    request.post({ url: "http://biit.cs.ut.ee/gprofiler/gconvert.cgi", formData: formData }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        reject(err);
      }
      resolve(body);
    });
  });
  return promise;
};


module.exports = validateGp;