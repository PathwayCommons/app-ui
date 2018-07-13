const React = require('react');
const h = require('react-hyperscript');

class EnrichmentMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  getMinPvalue(){
    let min = 1;
    this.props.networkJSON.nodes.forEach(node => {
      if (node.data.p_value < min) min = node.data.p_value;
    });
    return min;
  }

  getMaxPvalue(){
    let max = 0;
    this.props.networkJSON.nodes.forEach(node => {
      if (node.data.p_value > max) max = node.data.p_value;
    });
    return max;
  }

  render(){
    let min = this.getMinPvalue();
    let max = this.getMaxPvalue();

    return h('div',[
      h('h2', 'P-value'),
      h('div.enrichment-legend', [
        h('p', `0`),
        h('p', `1`)
      ])
    ]);
  }
}
module.exports = EnrichmentMenu;