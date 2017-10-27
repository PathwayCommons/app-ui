const CDC = require('../../../../services/').CDC;

const bindMove = (uri, version, editkey, cy) => {
  cy.on('free', 'node', function(evt) {
    //CDC.submitDiff(uri, version, editkey, evt.target.id(), evt.target.position());
    console.log('Stopped dragging the node:\n'+evt.target.id()+'\nAt position:\n'+JSON.stringify(evt.target.position()));
  });
};

module.exports = bindMove;