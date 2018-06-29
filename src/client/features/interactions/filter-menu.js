const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * 
   * @param {*} degreeValues array returned by getUniqueDegreeValues
   * @description Hides nodes based on their betweenness centrality, determined by on-screen slider
   */
  sliderUpdate(){
    const cy = this.props.cy;

    //Starts the slider at a non-zero value
    let sliderVal = document.getElementById('selection-slider').value;

    cy.nodes().forEach(node => {
      if(node.data('bcVal') < sliderVal)
        node.addClass('hidden');
      else 
        node.removeClass('hidden');
    });
  }

  /**
   * 
   * @param {*} nodesToShow Number of nodes that should be visible to user on first load of network
   * @description Hides all nodes based on betweenness centrality, keeping only `nodesToShow` visible.
   * Also sets the default value for the slider, based on this number.
   */
  findDefaultAndUpdate(nodesToShow){
    const cy = this.props.cy;

    let sortedNodes = cy.nodes().sort(function( a, b ){
      return b.data('bcVal') - a.data('bcVal');
    });

    let i = 0;
    let returnValue = 0;
    sortedNodes.forEach(node => {
      if(i<nodesToShow)
        returnValue =  node.data('bcVal');
      i++;
    });

    cy.nodes().forEach(node => {
      if(node.data('bcVal') < returnValue)
        node.addClass('hidden');
    });

    return returnValue;
  }


  render(){
    const props= this.props;
    const defaultSliderVal = this.findDefaultAndUpdate(20);

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

    //-2 so the last tick always shows at least 1 node
    //Slider listed under 'Visible Nodes' in the interaction viewer
    const slider = [
      h("input",{type:"range",id:'selection-slider',min:0,max:1,step:0.01,defaultValue:defaultSliderVal,onInput:() => this.sliderUpdate()}),
    ];

    return h('div',[
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