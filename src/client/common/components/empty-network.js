const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');




class EmptyNetwork extends React.Component {
  render(){
    let { msg } = this.props;
    return h('div.empty-network',[
      h('i.pc-logo'),
      h('h1.empty-network-message', msg),
      h(Link, { to: { pathname: '/' } }, 'Return to PC Home')
    ]);
  }
}

module.exports = EmptyNetwork;