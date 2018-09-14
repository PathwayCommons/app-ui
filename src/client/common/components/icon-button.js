const React = require('react');
const h = require('react-hyperscript');

const Tooltip = require('./tooltip');
const classNames = require('classnames');

class IconButton extends React.Component {
  render(){
    let { description, onClick, isActive, icon } = this.props;

    onClick = onClick || (function(){});

    return h('button.icon-button.button-toggle.plain-button', {
        onClick: e => onClick(e),
        className: classNames({ 'button-toggle-on': isActive })
      }, [
        h(Tooltip, { description }, [
          h('span', [
            h('i.material-icons', icon)
          ])
        ])
      ]);
  }
}

module.exports = IconButton;