const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');




class CytoscapeNetwork extends React.Component {

  componentDidMount(){
    let { cySrv, onMount = () => {} } = this.props;
    cySrv.mount(this.network);

    onMount();
  }
  componentWillUnmount(){
    let { cySrv } = this.props;
    cySrv.destroy();
  }

  render(){
    return h('div.network', { className: classNames('network', this.props.className)}, [
      h('div.network-cy#cy', {
        ref: dom => this.network = dom
      })
    ]);
  }
}

module.exports = CytoscapeNetwork;