const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class EnrichmentServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      result: 'no result yet',
      genes: '',
      orderedQuery: undefined,
      userThr: undefined,
      minSetSize: undefined,
      maxSetSize: undefined,
      thresholdAlgo: undefined,
      custbg: undefined
    };
  }


  enrich() {
    ServerAPI.enrichment(this.state.genes, this.state.orderedQuery, this.state.userThr, this.state.minSetSize, this.state.maxSetSize, this.state.thresholdAlgo, this.state.custbg).then(res => {
      this.setState({ result: 'enrichment result is ' + JSON.stringify(res) });
    });
  }


  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter genes: a space-separated list of genes',
          onChange: e => this.setState({ genes: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', 'Optional parameters for enrichment service:'),
        h('div', [h('input', { placeholder: 'orderedQuery', onChange: e => this.setState({orderedQuery: e.target.value === '' ? undefined : e.target.value})}), 'default: 0']),
        h('div', [h('input', { placeholder: 'userThr', onChange: e => this.setState({userThr: e.target.value === '' ? undefined : e.target.value}) }), 'default: 1']),
        h('div', [h('input', { placeholder: 'minSetSize', onChange: e => this.setState({minSetSize: e.target.value === '' ? undefined: e.target.value}) }), 'default: 5']),
        h('div', [h('input', { placeholder: 'maxSetSize', onChange: e => this.setState({maxSetSize: e.target.value === '' ? undefined: e.target.value}) }), 'default: 200']),
        h('div', [h('input', { placeholder: 'thresholdAlgo', onChange: e => this.setState({thresholdAlgo: e.target.value === '' ? undefined: e.target.value}) }), 'default: fdr']),
        h('div', [h('input', { placeholder: 'custbg', onChange: e => this.setState({custbg: e.target.value === '' ? undefined: e.target.value}) }), 'default: ']),

        h('div', [h('button', { onClick: e => this.enrich() }, 'click to enrich')]),
        h('div', this.state.result)
      ]);
  }
}
module.exports = EnrichmentServiceUI;