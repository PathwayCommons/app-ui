const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

const INTERACTION_TYPES = {
  BINDING: 'Binding',
  PHOSPHORYLATION: 'Phosphorylation',
  EXPRESSION: 'Expression'
};


class InteractionsMenu extends React.Component {
  toggleIntnType(type){
    let { cySrv } = this.props;
    let cy = cySrv.get();
    let edges = cy.edges(`.${type}`);
    let nodes = edges.connectedNodes();

    edges.toggleClass('hidden');
    nodes.toggleClass('hidden');
  }

  render(){
    let { cySrv, controller } = this.props;
    let cy = cySrv.get();

    let hasType = (cy, type) => cy.edges(`.${type}`).length > 0;

    let hasPhosphorylations = hasType(cy, INTERACTION_TYPES.PHOSPHORYLATION);
    let hasExpressions = hasType(cy, INTERACTION_TYPES.EXPRESSION);
    let hasBindings = hasType(cy, INTERACTION_TYPES.BINDING);

    return h('div', [
      hasPhosphorylations ? h('button', { onClick: () =>  this.toggleIntnType(INTERACTION_TYPES.PHOSPHORYLATION) }, 'p' ) : null,
      hasExpressions ? h('button', { onClick: () =>  this.toggleIntnType(INTERACTION_TYPES.EXPRESSION) }, 'e' ) : null,
      hasBindings ? h('button', { onClick: () =>  this.toggleIntnType(INTERACTION_TYPES.BINDING) }, 'b' ) : null
    ]);
  }
}

module.exports = InteractionsMenu;