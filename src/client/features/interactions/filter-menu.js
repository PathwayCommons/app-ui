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
   * @param {*} e onChange event
   * @param {*} degreeValues array returned by getUniqueDegreeValues
   * @description Hides nodes based on their degree, degree determined by on-screen slider
   */
  sliderUpdate(degreeValues,initial){
    const nodes = this.props.cy.nodes();

    //any nodes with less than this number of degrees will not show in view
    //default setting is 2
    let sliderVal = null;
    if(initial){
      sliderVal = degreeValues[initial];
    }else{
      sliderVal = degreeValues[document.getElementById('selection-slider').value];
    }


    //loop through each node in the network
    for(let i in nodes){
        let node = nodes[i];
        
        //sometimes "nodes" are functions?? this fixes that
        if(node.show){ node.show(); }
        else{ continue; }

        if(node.degree() <= sliderVal){
          node.hide();
        }


    }
  }
  /**
   * @returns A sorted array containing each node in the array's degree exactly once
   */
  getUniqueDegreeValues(){
    const nodes = this.props.cy.nodes();
    let degreeList = [0];


    //Create an array containing every unique number of degrees
    for(let i in nodes){
      let node = nodes[i];
      if(node.degree){
        let degree = node.degree();
        if(degreeList.indexOf(degree) === -1)
          degreeList.push(degree);
      }
    }
    //sort the array
    degreeList = degreeList.sort(function(a, b){return a - b;});
    return degreeList;
  }


  render(){
    const props= this.props;
    let degreeValues = this.getUniqueDegreeValues();
    this.sliderUpdate(degreeValues,2);

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
      h("input",{type:"range",id:'selection-slider',min:0,max:degreeValues.length-2,step:1,defaultValue:2,onInput:() => this.sliderUpdate(degreeValues)}),
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