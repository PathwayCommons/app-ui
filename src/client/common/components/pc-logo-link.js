const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

class PcLogoLink extends React.Component {
  render() {
    let cn = this.props.className;
    return h('a', { href: '/' }, [ h('div', { className: classNames('pc-logo', cn) }) ]);
  }
}

module.exports = PcLogoLink;