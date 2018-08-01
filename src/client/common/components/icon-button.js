const React = require('react');
const h = require('react-hyperscript');

const Tooltip = require('./tooltip');
const classNames = require('classnames');

class IconButton extends React.Component {
  render(){
    let { description, onClick, isActive, icon } = this.props;


    return h(Tooltip, { description }, [
      h('div.icon-button', { 
        onClick: e => onClick(e),
        className: classNames({ 'icon-button-active': isActive })
      }, [
        h('i.material-icons', icon)
      ])
    ]);
  }
}

module.exports = IconButton;