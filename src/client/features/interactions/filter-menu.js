const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  render(){
    const props= this.props;
    const buttons= _.map(props.buttonsClicked,(clicked,type)=>
    h('div',{
        key:type,
        className:classNames ('interaction-filter-button', clicked? 'interaction-filter-clicked':'interaction-filter-not-clicked'),
        onClick: () => props.filterUpdate(type)
      },
      [
        h('div',{className:classNames(type,'interaction-filter-legend')}),
        h('h3.button-label',type),
        h('i', {className: classNames('common-icon-button','material-icons','icon-cutoff',{ 'common-icon-button-active': !clicked})}, clicked ? 'close':'check')
      ]
    ));
    return h('div',[
      h('h2', 'Settings'),
      h('h3', 'Interaction Filters'),
      buttons,
      h('h3', 'Nodes'),
      h('input.interaction-slider',{type:'range', min:0, max:props.sliderMax,value:props.numNodesToHave,  
        onChange:(evt)=>props.sliderUpdate({numNodesToHave:_.toNumber(evt.target.value), currentNumberOfNodes:props.numNodesToHave})})
    ]);
  }
}
module.exports = InteractionsFilterMenu; 