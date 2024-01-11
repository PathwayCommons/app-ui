const h = require('react-hyperscript');
const { Component } = require('react');
const { Link } = require('react-router-dom');

const { ServerAPI } = require('../../services');

class Biofactoid extends Component {
  constructor(props){
    super(props);

    this.state = {
      docs: []
    };
  }
  componentDidMount(){
    ServerAPI.getAllDocs().then( res => this.setState({docs: res}));
  }

  render(){
    let { docs } = this.state;
    return h('div.biofactoid', docs.map( f => {
      return h(Link, { className: 'plain-link', to: { pathname: `/biofactoid/${f.id}`}, target: '_blank' }, f.id);
    }));
  }
}



module.exports = Biofactoid;