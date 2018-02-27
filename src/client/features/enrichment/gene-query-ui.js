const React = require('react');
const h = require('react-hyperscript');

const {ServerAPI} = require('../../services');

class GeneQuery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      result: 'no result yet',
      query: ''
    };
  }
  queryGenes() {
    ServerAPI.geneQuery(this.state.query).then(res => {
      this.setState({result: 'result is ' + res});
    });
  }
  render() {
    // return h('div', [
    //   h('button', { onClick: e => this.queryGenes()}, 'click to test gene query'),
    //   h('input', { placeholder: 'enter genes', onChange: e => this.setState({query: e.target.value})}),
    //   this.state.result
    // ]);
    return h('div',
    [
      h('div', [h('button', { onClick: e => this.queryGenes()}, 'click to test gene query')]),
      h('div', [h('input', { placeholder: 'enter genes', onChange: e => this.setState({query: e.target.value})})]),
      this.state.result
    ]);

  }

}


module.exports = GeneQuery;