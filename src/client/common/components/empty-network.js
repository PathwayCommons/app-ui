const React = require('react');
const h = require('react-hyperscript');




class EmptyNetwork extends React.Component {
  render(){
    let { msg } = this.props;
    return h('div.empty-network',[
      h('i.pc-logo'),
      h('h1.empty-network-message', msg),
      h('a.plain-link', { href:'http://apps.pathwaycommons.org' }, 'Return to PC Home')
    ]);
  }
}

module.export = EmptyNetwork;