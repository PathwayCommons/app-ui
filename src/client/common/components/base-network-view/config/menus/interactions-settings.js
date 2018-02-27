const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

class InteractionsSettingsMenu extends React.Component {
  render(){
   const props= this.props;
   const buttons= [...props.buttons].map(([type, clicked])=>
   h('div',{key:type,className:classNames ('interaction-settings-button',clicked? 'interaction-settings-clicked':'interaction-settings-not-clicked'),onClick: (e) => props.settingChange(e,type)},[
        h('div',{className:classNames(type,'interaction-settings-legend')}),
        h('h2.button-label',type),
      ]));
    return h('div',buttons);
    }
  
}
module.exports = InteractionsSettingsMenu;