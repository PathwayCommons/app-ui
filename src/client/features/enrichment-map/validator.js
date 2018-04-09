const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class ValidatorServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      result: 'no result yet',
      genes: '',
      target: undefined,
      organism: undefined
    };
  }
  geneQuery() {
    ServerAPI.geneQuery(this.state.genes, this.state.target, this.state.organism).then(res => {
      this.setState({ result: 'validator result from gConvert is ' + JSON.stringify(res) });
    });
  }
  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter genes: a space-separated list of genes', onChange: e => this.setState({ genes: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', 'Optional parameters for gene validation service'),
        h('div', [h('input', {
          placeholder: 'target', onChange: e => this.setState({ target: e.target.value === '' ? undefined : e.target.value}),
        })]),
        h('div', [h('input', {
          placeholder: 'organism', onChange: e => this.setState({ organism: e.target.value === '' ? undefined : e.target.value}),
        })]),
        h('div', [h('button', { onClick: e => this.geneQuery() }, 'click to validate')]),
        this.state.result
      ]);
  }
}


module.exports = ValidatorServiceUI;