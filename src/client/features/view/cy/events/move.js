const apiCaller = require('../../../../services').apiCaller;

const bindMove = (uri, version, cy) => {
  cy.on('free', 'node', function(evt) {
    apiCaller.submitNodeChange(uri, version, evt.target.id(), evt.target.position());
  });
};

module.exports = bindMove;