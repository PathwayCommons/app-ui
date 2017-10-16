const CDC = require('../../../../services/index.js').CDC;

const bindMove = (uri, version, editkey, cy) => {

  cy.on('free', 'node', function(evt) {
    console.log('Stopped dragging the node:\n'+evt.target.id()+'\nAt position:\n'+JSON.stringify(evt.target.position()));
  });

};

module.exports = bindMove;