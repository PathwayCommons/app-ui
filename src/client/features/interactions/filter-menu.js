const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  sliderUpdate(e,degreeValues){
    const nodes = this.props.cy.nodes();
    let sliderVal = degreeValues.get(document.getElementById('selection-slider').value);
    console.log(sliderVal);

    if(sliderVal < 1){
        for(let i in nodes){
            if(nodes[i].show)
                nodes[i].show();
        }
        return;
    }
    for(let i in nodes){
        //Get data needed to make decision about whether to hide or show the node
        let node = nodes[i];
        //sometimes "nodes" are functions?? this fixes that
        if(node.show){ node.show(); }
        else{ continue; }
        if(node.degree() <= sliderVal){
          node.hide();
        }

    }
  }

  getUniqueDegreeValues(){
    const nodes = this.props.cy.nodes();
    let degreeList = [];

    for(let i in nodes){
      let node = nodes[i];
      if(node.degree){
        let degree = node.degree();
        if(degreeList.indexOf(degree) === -1)
          degreeList.push(degree);
      }
    }
    degreeList = degreeList.sort(function(a, b){return a - b;});

    let degreeListMap = new Map();
    degreeListMap.set((-1).toString(),-1);
    degreeListMap.set((0).toString(),0);
    for(let i in degreeList){
      let degree = degreeList[i];
      degreeListMap.set((parseInt(i) + 1).toString(),degree);
    }
    return degreeListMap;
  }


  render(){
    const props= this.props;
    let degreeValues = this.getUniqueDegreeValues();

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

    const slider = [
      h("input",{type:"range",id:'selection-slider',min:0,max:degreeValues.size-3,step:1,defaultValue:0,onInput:(e) => this.sliderUpdate(e,degreeValues)}),
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