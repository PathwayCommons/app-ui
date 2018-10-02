const h = require('react-hyperscript');
const { Component } = require('react');
const { Link } = require('react-router-dom');

const { ServerAPI } = require('../../services/');

class Factoids extends Component {
  constructor(props){
    super(props);

    this.state = {
      factoids: []
    };
  }
  componentDidMount(){
    ServerAPI.getFactoids().then( res => this.setState({factoids: res}));
  }

  render(){
    let { factoids} = this.state;
    return h('div.factoids', factoids.map( f => {
      return h(Link, {   className: 'plain-link', to: { pathname: `/factoids/${f.id}`}}, f.id);
    }));
  }
}



module.exports = Factoids;