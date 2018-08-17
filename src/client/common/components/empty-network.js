const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');




class EmptyNetwork extends React.Component {
  render(){
    let { msg, app} = this.props;

    let linkToPCSearch = (app === 'interactions') ? ['Return to', h(Link, { className: 'plain-link', to: { pathname: '/' } },  ' Pathway Commons Search')] : null;

    return h('div.empty-network',[
      h('div.empty-network-header', [
        h('div.pc-logo'),
        h('h1.empty-network-message', msg)
      ]),
      linkToPCSearch
    ]);
  }
}

module.exports = EmptyNetwork;