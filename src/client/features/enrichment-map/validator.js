const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class ValidatorServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      result: 'no result yet',
      query: ''
    };
  }
  validatorGconvert() {
    ServerAPI.validatorGconvert(this.state.query).then(res => {
      this.setState({ result_validate_gp: 'validator result from gConvert is ' + JSON.stringify(res) });
    });
  }
  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter genes: a list of gene names separated by whitespace', onChange: e => this.setState({ query: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', [h('button', { onClick: e => this.validatorGconvert() }, 'click to validate')]),
        this.state.result
      ]);
  }
}


module.exports = ValidatorServiceUI;