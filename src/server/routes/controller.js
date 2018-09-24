//Import Depedencies
const db = require('./../database/utilities');
const update = require('./../database/update');
const logger = require('./../logger');
const diffSaver = require('./../database/saveDiffs');



// submitLayout(pcID, releaseID, layout, userID)
// saves the given layout and the id of the user to the version specified by
// (pcID, releaseID)
function submitLayout(pcID, releaseID, layout, userID) {
  //Get the requested layout
  return db.connect().then((connection) => {
    update.saveLayout(pcID, releaseID, layout, userID, connection);
    return 'Layout was updated.';

  }).catch((e) => {
    logger.error(e);
    return 'ERROR: Something went wrong in submitting the layout';
  });
}

// submitGraph(pcID, releaseID, newGraph) saves the given graph
// to the version specified by (pcID, releaseID)
function submitGraph(pcID, releaseID, newGraph) {
  return db.connect().then((connection) => {
    return update.updateGraph(pcID, releaseID, newGraph, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// submitDiff(pcID, releaseID, diff, userID) updates the saved
// layout with the given diff for the version specified by (pcID, releaseID)
function submitDiff(pcID, releaseID, diff, userID) {
  return db.connect().then((connection) => {
    return diffSaver.saveDiff(pcID, releaseID, diff, userID, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// endSession(pcID, releaseID, userID) removes the userID from the list
// of users editing the pathway specified by  (pcID, releaseID)
function endSession(pcID, releaseID, userID) {
  return db.connect().then((connection) => {
    return diffSaver.popUser(pcID, releaseID, userID, connection);
  });
}

module.exports = {
  submitLayout,
  submitGraph,
  submitDiff,
  endSession
};