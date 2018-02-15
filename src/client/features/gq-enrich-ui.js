const React = require('react');
const h = require('react-hyperscript');

const { ServerAPI } = require('../services');

class GqEnrich extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      result_gq: 'no result yet',
      result_enrich: 'no result yet',
      query: '',
      setting: '""'
    };
  }
  queryGenes() {
    ServerAPI.geneQuery(this.state.query).then(res => {
      this.setState({ result_gq: 'validator result is ' + res });
    });
  }

  enrich() {
    ServerAPI.enrichment(this.state.query, this.state.setting).then(res => {
      this.setState({ result_enrich: 'enrichment result is ' + res });
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
      h('div', [h('input', {
        placeholder: 'enter genes',
        onChange: e => this.setState({query: e.target.value}),
        style: {
          width: '100vw',
        }
      })]),
      h('div', [h('input', {
        placeholder: 'enter settings',
        onChange: e => this.setState({setting: (e.target.value == "") ? '""':  e.target.value}),
        style: {
          width: '100vw',
        }
      })]),
      h('div', [h('button', { onClick: e => this.queryGenes()}, 'click to test gene query')]),
      h('div', this.state.result_gq),
      h('div', [h('button', { onClick: e => this.enrich()}, 'click to enrich')]),
      h('div', this.state.result_enrich)


    ]);
  }
}

module.exports = GqEnrich;