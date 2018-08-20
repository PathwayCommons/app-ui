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
    let { BINDING, PHOSPHORYLATION, EXPRESSION } = INTERACTION_TYPES;

    this.state = {
      [BINDING]: true,
      [PHOSPHORYLATION]: true,
      [EXPRESSION]: true
    };

    // 15 updates per second max
    this.throttledHandleSliderChange = _.throttle(() => this.handleSliderChange(), 1000/15);
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

  getMetricSortedNodes(){
    if(this._sortedNodes){ // cached
      return this._sortedNodes;
    }

    let cy = this.props.cySrv.get();
    let nodes = cy.nodes();
    let sortedNodes = nodes.sort( (n0, n1) => n1.data('metric') - n0.data('metric') );

    this._sortedNodes = sortedNodes; // put in cache

    return sortedNodes;
  }

  handleSliderChange(){
    let cy = this.props.cySrv.get();
    let sortedNodes = this.getMetricSortedNodes();
    let metricCutoff = this.slider.value;

    let elesToHide = sortedNodes.slice(metricCutoff);

    cy.batch(() => {
      sortedNodes.not(elesToHide).removeClass('metric-hidden');
      elesToHide.addClass('metric-hidden');

      //hide open tooltip if node is hidden
      elesToHide.forEach(element => {
        let tooltip = element.scratch('_tooltip');
        if (tooltip) {
          tooltip.hide();
        }
      });

    });
  }

  componentDidMount(){
    this.getMetricSortedNodes(); // make sure cache is filled
    this.throttledHandleSliderChange();
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

    let defaultSliderValue = 0;
    const numberOfNodes = this.getMetricSortedNodes().length;
    if(numberOfNodes < 25){
      defaultSliderValue = numberOfNodes;
    }else{
      defaultSliderValue = Math.floor( numberOfNodes / 2);
    }

    let InteractionToggleButton = props => {
      let { type, active } = props;
      let legendClass = `interactions-filter-color-${type.toLowerCase()}`;

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
            'interactions-filter-color': true
          })
        } ),
        h('div.interactions-filter-label', type),
        h('div.interactions-filter-check', [
          h('i.material-icons', (active ? 'check_box' : 'check_box_outline_blank'))
        ])
      ]);
    };



    return h('div.interactions-sidebar', [
      h('h3', 'Filter interactions'),
      hasBindings ? h(InteractionToggleButton, { type: BINDING, active: Binding }) : null,
      hasExpressions ? h(InteractionToggleButton, { type: EXPRESSION, active: Expression }) : null,
      hasPhosphorylations ? h(InteractionToggleButton, { type: PHOSPHORYLATION, active: Phosphorylation }) : null,
      h('h3', 'Filter genes'),
      h('input.interactions-sidebar-vis-filter', {
        type: 'range',
        ref: ele => this.slider = ele,
        min: 1,
        max: this.getMetricSortedNodes().length,
        step: 1,
        defaultValue: defaultSliderValue,
        onInput: () => this.throttledHandleSliderChange()
       }),
       h('div.interactions-slider-labels', [
         h('span', 1),
         h('span', this.getMetricSortedNodes().length)
       ])
    ]);
  }
}

module.exports = InteractionsMenu;