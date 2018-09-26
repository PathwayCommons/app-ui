const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const { PC_URL } = require('../../../config');

class PcLogoLink extends React.Component {
  render() {
    let cn = this.props.className;
    return h('a', { href: PC_URL }, [ h('div', { className: classNames('pc-logo', cn) }) ]);
  }
}

module.exports = PcLogoLink;