const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
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
    return h('div',[
      h('h2', 'Settings'),
      h('h3.interaction-h3', 'Interaction Filters'),
      buttons,
      h('h3.interaction-h3', 'Nodes'),
      h('input.interaction-slider',{type:'range', min:0, max:props.sliderMax,value:props.numNodesToHave,  
        onChange:(evt)=>props.sliderUpdate(_.toNumber(evt.target.value))})
    ]);
  }
}
module.exports = InteractionsFilterMenu; 