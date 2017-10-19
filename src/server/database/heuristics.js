<<<<<<< HEAD


/**
    Pathway Commons Central Data Cache

    Pathway Commons Layout Selection
    heuristics.js

    Purpose : Determines the layout to be returned based on a list of options

    Requires : A running rethinkdb connection

    Effects :

    Note : Currently just grabs the most recent option. If that isn't going to change this
    can be removed, but this architecture allow for 'heuristics' to be genuinely implemented 
    at a later date.

    TODO: 

    @author Geoff Elder
    @version 1.1 2017/10/10
**/


=======
>>>>>>> 764c802a3d679603c48bae2209c95baf2a6d98d7
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