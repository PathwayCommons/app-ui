const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');

class EMapServiceUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emapResult: 'no result yet',
      pathwayIdList: ''
    };
  }

  generateCys() {
    ServerAPI.emap(this.state.pathwayIdList).then(res => {
      this.setState({ emapResult: 'emap result is: '+JSON.stringify(res)});
    });
  }

  render() {
    return h('div',
      [
        h('div', [h('input', {
          placeholder: 'enter pathway IDs: a list of GO/REACTOME separated by whitespace', onChange: e => this.setState({ pathwayIdList: e.target.value }),
          style: {
            width: '100vw',
          }
        })]),
        h('div', [h('button', { onClick: e => this.generateCys() }, 'click to generate info for network')]),
        this.state.emapResult
      ]);
  }
}
module.exports = EMapServiceUI;