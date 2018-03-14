const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class EnrichmentServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enrichResult: 'no result yet',
      query: '',
      output: '',
      organism: '',
      significant: '',
      sortByStructure: '',
      orderedQuery: '',
      asRanges: '',
      noIea: '',
      underrep: '',
      hierfiltering: '',
      userThr: '',
      minSetSize: '',
      maxSetSize: '',
      thresholdAlgo: '',
      domainSizeType: '',
      custbg: '',
      custbgCb: ''
    };
  }

  enrich() {
    ServerAPI.enrichment(this.state.query, this.state.output, this.state.organism, this.state.significant, this.state.sortByStructure, this.state.orderedQuery, this.state.asRanges, this.state.noIea, this.state.underrep, this.state.hierfiltering, this.state.userThr, this.state.minSetSize, this.state.maxSetSize, this.state.thresholdAlgo, this.state.domainSizeType, this.state.custbg, this.state.custbgCb).then(res => {
      this.setState({ enrichResult: 'enrichment result is ' + JSON.stringify(res) });
    });
  }


  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter genes: a list of gene names separated by whitespace',
          onChange: e => this.setState({ query: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', 'Optional Settings for enrichment:'),
        h('div', [h('input', { placeholder: 'output', onChange: e => this.setState({output: e.target.value}) }), 'default: mini']),
        h('div', [h('input', { placeholder: 'organism', onChange: e => this.setState({organism: e.target.value}) }), 'default: hsapiens']),
        h('div', [h('input', { placeholder: 'significant', onChange: e => this.setState({significant: e.target.value}) }), 'default: 1']),
        h('div', [h('input', { placeholder: 'sortByStructure', onChange: e => this.setState({sortByStructure: e.target.value}) }), 'default: 1']),
        h('div', [h('input', { placeholder: 'orderedQuery', onChange: e => this.setState({orderedQuery: e.target.value}) }), 'default: 0']),
        h('div', [h('input', { placeholder: 'asRanges', onChange: e => this.setState({asRanges: e.target.value}) }), 'default: 0']),
        h('div', [h('input', { placeholder: 'noIea', onChange: e => this.setState({noIea: e.target.value}) }), 'default: 1']),
        h('div', [h('input', { placeholder: 'underrep', onChange: e => this.setState({underrep: e.target.value}) }), 'default: 0']),
        h('div', [h('input', { placeholder: 'userThr', onChange: e => this.setState({userThr: e.target.value}) }), 'default: 1']),
        h('div', [h('input', { placeholder: 'hierfiltering', onChange: e => this.setState({hierfiltering: e.target.value}) }), 'default: none']),
        h('div', [h('input', { placeholder: 'minSetSize', onChange: e => this.setState({minSetSize: e.target.value}) }), 'default: 5']),
        h('div', [h('input', { placeholder: 'maxSetSize', onChange: e => this.setState({maxSetSize: e.target.value}) }), 'default: 200']),
        h('div', [h('input', { placeholder: 'thresholdAlgo', onChange: e => this.setState({thresholdAlgo: e.target.value}) }), 'default: fdr']),
        h('div', [h('input', { placeholder: 'domainSizeType', onChange: e => this.setState({domainSizeType: e.target.value}) }), 'default: annotated']),
        h('div', [h('input', { placeholder: 'custbg', onChange: e => this.setState({custbg: e.target.value}) }), 'default: none']),
        h('div', [h('input', { placeholder: 'custbgCb', onChange: e => this.setState({custbgCb: e.target.value}) }), 'default: 0']),


        h('div', [h('button', { onClick: e => this.enrich() }, 'click to enrich')]),
        h('div', this.state.enrichResult)
      ]);
  }
}
module.exports = EnrichmentServiceUI;