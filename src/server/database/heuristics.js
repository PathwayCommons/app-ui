/* This module handles the choosing of a layout to be displayed
  from the set of human submitted layouts.

  Currently, this simplly means grabbing the most recent layout,
  but in theory this file could be expanded to allow for weighted combinations
  or some other form of display choosing algorithm as the need arises.

*/

// --------- Fake Heuristics ---------------
function run(layouts, trimValues, callback) {
    let layout = layouts.toArray()
      .then((result) => {

        //Return last 10 layouts\
        if (result.length <= 1 && trimValues){
          return [];
        }
        if(result.length < -10 && trimValues){
          return result;
        }
        if(result.length > -10 && trimValues){
          return result.slice(-10);
        }

        return result[result.length-1];
      });
  
    if (callback) {
      callback(layout);
    } else {
      return layout;
    }
  }

  module.exports = {
      run
  };