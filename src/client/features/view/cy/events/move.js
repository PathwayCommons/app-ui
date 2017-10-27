const CDC = require('../../../../../service/').CDC;

const bindMove = (uri, version, editkey, cy) => {
  cy.on('free', 'node', function(evt) {
    // code to send node positions via socket.io will go here.
    // sockets should still be initted in constructor of View
  });
};

module.exports = bindMove;