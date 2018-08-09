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

  handleSliderChange(){
    let cy = this.props.cySrv.get();
    let metricCutoff = this.slider.value;

    let nodeHasNoVisibleEdges = node => node.connectedEdges().every( edge => edge.hasClass('type-hidden') || edge.hasClass('metric-hidden'));


    let nodesToHide = cy.nodes().sort( (n0, n1) => n0.data('metric') - n1.data('metric') ).slice(0, metricCutoff);
    let elesToHide = nodesToHide.union(nodesToHide.connectedEdges()).union(cy.nodes().filter( nodeHasNoVisibleEdges ));


    elesToHide.addClass('metric-hidden');
    cy.elements().difference(elesToHide).removeClass('metric-hidden');
  }

  render(){
    let { cySrv } = this.props;
    let { Binding, Expression, Phosphorylation } = this.state;
    let cy = cySrv.get();

    let hasType = (cy, type) => cy.edges(`.${type}`).length > 0;
    let { BINDING, PHOSPHORYLATION, EXPRESSION } = INTERACTION_TYPES;


    let hasPhosphorylations = hasType(cy, PHOSPHORYLATION);
    let hasExpressions = hasType(cy, EXPRESSION);
    let hasBindings = hasType(cy, BINDING);

    let InteractionToggleButton = props => {
      let { type, active } = props;
      return h('div', {
        onClick: () =>  this.toggleIntnType(type),
        className: classNames('interaction-filter-button', active ? 'interaction-filter-active' : 'interaction-filter-not-active'),

      }, [
        h('div', { className: classNames('interaction-filter-legend', { [type]: active } ) } ),
        h('h4.button-label', type)
      ]);
    };

    return h('div', [
      h('h3', 'Interaction Filters'),
      hasPhosphorylations ? h(InteractionToggleButton, { type: PHOSPHORYLATION, active: Phosphorylation }) : null,
      hasBindings ? h(InteractionToggleButton, { type: BINDING, active: Binding }) : null,
      hasExpressions ? h(InteractionToggleButton, { type: EXPRESSION, active: Expression }) : null,
      h('h3', 'Visible Entities'),
      h('input', {
        type: 'range',
        ref: ele => this.slider = ele,
        min: 0,
        max: 49,
        step: 1,
        defaultValue: 35,
        onInput: () => this.handleSliderChange()
       }),
       h('div.slider-bottom', [
         h('span.most', 'More'),
         h('span.least', 'Less')
       ])
    ]);
  }
}

module.exports = InteractionsMenu;