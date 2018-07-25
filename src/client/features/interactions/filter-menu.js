const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = props;
    this.sliderUpdate = _.debounce(this.sliderUpdate,150);
  }

  /**
   * 
   * @param {*} degreeValues array returned by getUniqueDegreeValues
   * @description Hides nodes based on their betweenness centrality, determined by on-screen slider
   */
  sliderUpdate(){
    //set up variables
    const cy = this.props.cySrv.get();
    let sliderVal = document.getElementById('selection-slider').value;
    let sortedNodes = cy.nodes().sort( (a,b) => {
      return a.data('metric') - b.data('metric');
    });
    let i=0;

    cy.batch( () => {
      sortedNodes.forEach( node => {
        if(i<=sliderVal)
          node.addClass('hidden');
        else
          node.removeClass('hidden');
        i++;
      });
    });
  }


  render(){
    const props= this.props;

    //Networks end up with all nodes next to 0 bcVal other than search term
    //slider becomes a toggle since noone has the dexterity to distinguish values at the low end
    //instead use the second highest bcVal as the maximum for slider, so its actually useful
    const buttons= _.map(props.filters,(active,type)=>
    h('div',{
        key:type,
        className:classNames ('interaction-filter-button', active ? 'interaction-filter-active':'interaction-filter-not-active'),
        onClick: () => props.filterUpdate(type)
      },
      [
        h('div',{className:classNames('interaction-filter-legend',{[type]:active})}),
        h('h3.button-label',type),
      ]
    ));

    //Slider listed under 'Visible Nodes' in the interaction viewer
    const slider = [
      h('input', {type: 'range', id: 'selection-slider', min: 0, max: 50, step: 1, defaultValue:20, 
      onInput:() => this.sliderUpdate() }),
    ];
    

    return h('div.sidebar-container',{style:{width:'100%'}},[
      h('h2', 'Interaction Filters'),
      buttons,
      h('h2.slider-heading','Visible Nodes'),
      h('div.slider-wrapper',slider),
      h('div.slider-bottom',[
        h('span.most','Most'),
        h('span.least','Least')
      ])
    ]);
  }
}
module.exports = InteractionsFilterMenu; 