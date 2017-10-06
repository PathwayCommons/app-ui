const bindMove = (cy) => {
  // Mobile finish dragging node event
  // cy.on('tapdragout', 'node', function(evt) {
  //   console.log('Stopped dragging the node:\n'+evt.target.id()+'\nAt position:\n'+JSON.stringify(evt.target.position()));
  // });

  //
  cy.on('free', 'node', function(evt) {
    //console.log('Stopped dragging the node:\n'+evt.target.id()+'\nAt position:\n'+JSON.stringify(evt.target.position()));
  });

};

module.exports = bindMove;