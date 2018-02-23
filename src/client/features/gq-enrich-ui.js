const React = require('react');
const h = require('react-hyperscript');

const { ServerAPI } = require('../services');

class GqEnrich extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      result_gq: 'no result yet',
      result_validate_gp: 'no result yet',
      result_enrich: 'no result yet',
      query: '',
      setting: '""'
    };
    this.changeSetting = this.changeSetting.bind(this);
  }
  queryGenes() {
    ServerAPI.geneQuery(this.state.query).then(res => {
      this.setState({ result_gq: 'validator result is ' + res });
    });
  }

  validateGp() {
    ServerAPI.validateGp(this.state.query).then(res => {
      this.setState({ result_validate_gp: 'validator result from gProfiler is ' + JSON.stringify(res) });
    });
  }

  enrich() {
    ServerAPI.enrichment(this.state.query, this.state.setting).then(res => {
      this.setState({ result_enrich: 'enrichment result is ' + JSON.stringify(res) });
    });
  }

  changeSetting(key, val) {
    if (val == "") {
      delete this.state.setting[key];
    } else if (this.state.setting == '""') {
      const copy = {};
      copy[key] = val;
      this.setState({ setting: copy });
    } else {
      const copy = JSON.parse(JSON.stringify(this.state.setting));
      copy[key] = val;
      this.setState({ setting: copy });
    }
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
        h('div', [h('input', { placeholder: 'output', onChange: e => this.changeSetting('output', e.target.value) }), "default: mini"]),
        h('div', [h('input', { placeholder: 'organism', onChange: e => this.changeSetting('organism', e.target.value) }), "default: hsapiens"]),
        h('div', [h('input', { placeholder: 'significant', onChange: e => this.changeSetting('significant', e.target.value) }), "default: 1"]),
        h('div', [h('input', { placeholder: 'sort_by_structure', onChange: e => this.changeSetting('sort_by_structure', e.target.value) }), "default: 1"]),
        h('div', [h('input', { placeholder: 'ordered_query', onChange: e => this.changeSetting('ordered_query', e.target.value) }), "default: 0"]),
        h('div', [h('input', { placeholder: 'as_ranges', onChange: e => this.changeSetting('as_ranges', e.target.value) }), "default: 0"]),
        h('div', [h('input', { placeholder: 'no_iea', onChange: e => this.changeSetting('no_iea', e.target.value) }), "default: 1"]),
        h('div', [h('input', { placeholder: 'underrep', onChange: e => this.changeSetting('underrep', e.target.value) }), "default: 0"]),
        h('div', [h('input', { placeholder: 'user_thr', onChange: e => this.changeSetting('user_thr', e.target.value) }), "default: 1"]),
        h('div', [h('input', { placeholder: 'hierfiltering', onChange: e => this.changeSetting('hierfiltering', e.target.value) }), "default: none"]),
        h('div', [h('input', { placeholder: 'min_set_size', onChange: e => this.changeSetting('min_set_size', e.target.value) }), "default: 5"]),
        h('div', [h('input', { placeholder: 'max_set_size', onChange: e => this.changeSetting('max_set_size', e.target.value) }), "default: 200"]),
        h('div', [h('input', { placeholder: 'threshold_algo', onChange: e => this.changeSetting('threshold_algo', e.target.value) }), "default: fdr"]),
        h('div', [h('input', { placeholder: 'domain_size_type', onChange: e => this.changeSetting('domain_size_type', e.target.value) }), "default: annotated"]),
        h('div', [h('input', { placeholder: 'custbg_cb', onChange: e => this.changeSetting('custbg_cb', e.target.value) }), "default: 0"]),
        h('div', [h('input', { placeholder: 'custbg', onChange: e => this.changeSetting('custbg', e.target.value) }), "default: none"]),

        h('div', [h('button', { onClick: e => this.validateGp() }, 'click to validate gene query by g:Convert')]),
        h('div', this.state.result_validate_gp),
        h('div', [h('button', { onClick: e => this.queryGenes() }, 'click to validate gene query')]),
        h('div', this.state.result_gq),
        h('div', [h('button', { onClick: e => this.enrich() }, 'click to enrich')]),
        h('div', this.state.result_enrich)
      ]);
  }
}

module.exports = GqEnrich;