const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const INTERACTION_TYPES = require('./types');

class InteractionsMenu extends React.Component {
  constructor(props){
    super(props);
    let { BINDING, MODIFICATION, EXPRESSION, OTHER } = INTERACTION_TYPES;

    this.state = {
      [BINDING]: true,
      [MODIFICATION]: true,
      [EXPRESSION]: true,
      [OTHER]: true
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

    cy.emit('hide-type');

    this.setState({[type]: !this.state[type] });
  }

  render(){
    let { cySrv } = this.props;
    let { Binding, Expression, Modification, Other } = this.state;
    let cy = cySrv.get();

    let hasType = (cy, type) => cy.edges(`.${type}`).length > 0;
    let { BINDING, MODIFICATION, EXPRESSION, OTHER } = INTERACTION_TYPES;

    let hasModifications = hasType(cy, MODIFICATION);
    let hasExpressions = hasType(cy, EXPRESSION);
    let hasBindings = hasType(cy, BINDING);
    let hasOther = hasType(cy, OTHER);

    let InteractionToggleButton = props => {
      let { type, active } = props;
      let legendClass = `interactions-color-${type.toLowerCase()}`;

      return h('div', {
        onClick: () =>  this.toggleIntnType(type),
        className: classNames({
          'interactions-filter-button': true,
          'interactions-filter-button-active': active
        }),

      }, [
        h('div', {
          className: classNames({
            [legendClass]: true,
            'interactions-color': true
          })
        } ),
        h('div.interactions-filter-label', type),
        h('div.interactions-filter-check', [
          h('i.material-icons', (active ? 'check_box' : 'check_box_outline_blank'))
        ])
      ]);
    };

    return h('div.interactions-sidebar', [
      hasBindings ? h(InteractionToggleButton, { type: BINDING, active: Binding }) : null,
      hasExpressions ? h(InteractionToggleButton, { type: EXPRESSION, active: Expression }) : null,
      hasModifications ? h(InteractionToggleButton, { type: MODIFICATION, active: Modification }) : null,
      hasOther ? h(InteractionToggleButton, { type: OTHER, active: Other }) : null,
    ]);
  }
}

module.exports = InteractionsMenu;