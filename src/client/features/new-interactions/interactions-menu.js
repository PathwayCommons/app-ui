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
  constructor(props){
    super(props);

    this.state = {
      Binding: true,
      Phosphorylation: true,
      Expression: true
    };
  }

  toggleIntnType(type){
    let { cySrv } = this.props;
    let cy = cySrv.get();
    let edges = cy.edges(`.${type}`);
    let nodes = edges.connectedNodes();

    let nodeHasNoVisibleEdges = node => node.connectedEdges().every( edge => edge.hasClass('type-hidden') || edge.hasClass('metric-hidden'));

    if( this.state[type] ){
      edges.addClass('type-hidden');
      nodes.filter( nodeHasNoVisibleEdges ).addClass('type-hidden');
    } else {
      nodes.removeClass('type-hidden');
      edges.removeClass('type-hidden');
    }

    this.setState({[type]: !this.state[type] });
  }

  render(){
    let { cySrv, controller } = this.props;
    let cy = cySrv.get();

    let hasType = (cy, type) => cy.edges(`.${type}`).length > 0;
    let { BINDING, PHOSPHORYLATION, EXPRESSION } = INTERACTION_TYPES;


    let hasPhosphorylations = hasType(cy, PHOSPHORYLATION);
    let hasExpressions = hasType(cy, EXPRESSION);
    let hasBindings = hasType(cy, BINDING);

    return h('div', [
      hasPhosphorylations ? h('button', { onClick: () =>  this.toggleIntnType(PHOSPHORYLATION) }, 'p' ) : null,
      hasExpressions ? h('button', { onClick: () =>  this.toggleIntnType(EXPRESSION) }, 'e' ) : null,
      hasBindings ? h('button', { onClick: () =>  this.toggleIntnType(BINDING) }, 'b' ) : null
    ]);
  }
}

module.exports = InteractionsMenu;