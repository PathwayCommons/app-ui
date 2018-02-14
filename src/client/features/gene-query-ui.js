const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const {ServerAPI} = require('../services');

class GeneQuery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      result: 'no result yet'
    };
  }
  queryGenes() {
    ServerAPI.geneQuery('TP53').then(res => {
      this.setState({result: 'result is ' + res});
    });
  }
  render() {
    return h('div', [
      h('button', { onClick: e => this.queryGenes()}, 'click to test gene query'),
      this.state.result
    ]);
  }

}


module.exports = GeneQuery;