const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        value:-1,
    };
  }

  sliderUpdate(e){

    this.setState({value:e.target.value});
    const nodes = this.props.cy.nodes();
    let sliderVal = this.state.value;

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


  render(){
    const props= this.props;
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
      h("input.selection-slider",{type:"range",min:"-1",max:"10",value:this.state.value,onChange:(e) => this.sliderUpdate(e)}),
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