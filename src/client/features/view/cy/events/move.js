const CDC = require('../../../../services').CDC;

const bindMove = (uri, version, cy) => {
  cy.on('free', 'node', function(evt) {
    CDC.submitNodeChange(uri, version, evt.target.id(), evt.target.position());
  });
};

module.exports = bindMove;