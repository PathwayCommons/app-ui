const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
    this.sliderUpdate = _.debounce(this.sliderUpdate,150);
  }

  /**
   * 
   * @param {*} degreeValues array returned by getUniqueDegreeValues
   * @description Hides nodes based on their betweenness centrality, determined by on-screen slider
   */
  sliderUpdate(){
    const cy = this.props.cy;

    //get the value from the slider
    let sliderVal = document.getElementById('selection-slider').value;

    //compare to pre-calculated centrality & hide if necessary
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
    //setting up variables
    const cy = this.props.cy;
    let i = 0;
    let returnValue = 0;
    let maxVal = 0;

    //sort nodes based on betweenness centrality
    let sortedNodes = cy.nodes().sort(function( a, b ){
      return b.data('bcVal') - a.data('bcVal');
    });

    //get the first nodesToShow nodes
    //also get the node with second-highest bcVal
    sortedNodes.forEach(node => {
      if(i<nodesToShow){
        returnValue =  node.data('bcVal');
        if(i === 1)
          maxVal = node.data('bcVal');
      }
      i++;
    });

    //hide all nodes other than the ones with top `nodesToShow`th bcVal
    cy.nodes().forEach(node => {
      if(node.data('bcVal') < returnValue)
        node.addClass('hidden');
    });

    //return the bcVal of the `nodesToShow`th highest bcVal
    //return the bcVal of the second highest bcVal
    return [returnValue,maxVal];
  }


  render(){
    const props= this.props;


    //Networks end up with all nodes next to 0 bcVal other than search term
    //slider becomes a toggle since noone has the dexterity to distinguish values at the low end
    //instead use the second highest bcVal as the maximum for slider, so its actually useful
    const [defaultSliderVal,maxSliderVal] = this.findDefaultAndUpdate(20);
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
      h("input",{type:"range",id:'selection-slider',min:0,max:maxSliderVal,step:0.0001,defaultValue:defaultSliderVal,
      onInput:() => this.sliderUpdate() }),
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