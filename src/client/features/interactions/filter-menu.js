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
   * @description Hides nodes based on their degree, degree determined by on-screen slider
   */
  sliderUpdate(initial){
    const cy = this.props.cy;
    const nodes = cy.nodes();
    const bc = cy.$().bc();

    //Starts the slider at a non-zero value
    let sliderVal;
    if(initial)
      sliderVal = initial;
    else
      sliderVal = document.getElementById('selection-slider').value;

    //loop through each node in the network
    for(let i in nodes){
        let node = nodes[i];
        
        //sometimes "nodes" are functions?? this fixes that
        if(node.show)
          node.removeClass('hidden');
        else
          continue;

        if(bc.betweenness(node) < sliderVal){
          node.addClass('hidden');
        }


    }
  }


  render(){
    const props= this.props;
    const defaultSliderVal = 0.15;
    this.sliderUpdate(defaultSliderVal);

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