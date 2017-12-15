const apiCaller = require('../../../services/apiCaller/');

const bindMove = (uri, version, cy) => {
  cy.on('free', 'node', function(evt) {
    if(evt.target.id() === 'do-not-submit') { return; }
    apiCaller.submitNodeChange(uri, version, evt.target.id(), evt.target.position());
  });
};

module.exports = bindMove;