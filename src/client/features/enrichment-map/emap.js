const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class EMapServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      result: 'no result yet',
      pathwayInfoList: '',
      JCWeight: undefined,
      OCWeight: undefined,
      cutoff: undefined
    };
  }

  emap(pathwayInfoList, JCWeight, OCWeight, cutoff) {
    ServerAPI.emap(this.state.pathwayInfoList, this.state.JCWeight, this.state.OCWeight, this.state.cutoff).then(res => {
      this.setState({ result: 'emap result is ' + JSON.stringify(res)});
    })
  }


  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter genes: a space-separated list of pathway IDs', onChange: e => this.setState({ pathwayInfoList: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', 'Optional parameters for emap service'),
        h('div', [h('input', {
          placeholder: 'JCWeight', onChange: e => this.setState({ JCWeight: e.target.value === '' ? undefined : e.target.value}),
        })]),
        h('div', [h('input', {
          placeholder: 'OCWeight', onChange: e => this.setState({ OCWeight: e.target.value === '' ? undefined : e.target.value}),
        })]),
        h('div', [h('input', {
          placeholder: 'cutoff', onChange: e => this.setState({ cutoff: e.target.value === '' ? undefined : e.target.value}),
        })]),
        h('div', [h('button', { onClick: e => this.emap() }, 'click to validate')]),
        this.state.result
      ]);
  }
}
module.exports = EMapServiceUI;