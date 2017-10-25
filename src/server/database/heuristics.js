
// --------- Fake Heuristics ---------------
// This should probably go in its own file
function run(layouts, callback) {
    var layout = layouts.toArray()
      .then((result) => {
        return result[0];
      }).catch(function (e) {
        throw e;
      });
  
    if (callback) {
      callback();
    } else {
      return layout;
    }
  }

  module.exports = {
      run : run
  };