const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

class InteractionsFilterMenu extends React.Component {
  render(){
   const props= this.props;
   const buttons= [...props.buttons].map(([type, clicked])=>
   h('div',{key:type,className:classNames ('interaction-filter-button',clicked? 'interaction-filter-clicked':'interaction-filter-not-clicked'),onClick: (e) => props.settingChange(e,type)},[
        h('div',{className:classNames(type,'interaction-filter-legend')}),
        h('h2.button-label',type),
      ]));
    return h('div',buttons);
    }
  
}
module.exports = InteractionsFilterMenu;