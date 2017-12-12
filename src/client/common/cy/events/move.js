const { ServerAPI } = require('../../../services/');

const bindMove = (uri, version, cy) => {
  cy.on('free', 'node', function(evt) {
    ServerAPI.submitNodeChange(uri, version, evt.target.id(), evt.target.position());
  });
};

module.exports = bindMove;