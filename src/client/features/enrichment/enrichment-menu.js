const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

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


    return h(Tabs, [
      h('div.enrichment-drawer-header', [
        h('h2', 'Enriched Network'),
        h(TabList, [
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
            }, 'Pathway Data')
        ])
      ]),
      h(TabPanel, [
        h('h4', 'P-Value Legend'),
        h('div.enrichment-legend', [
          h('p', `0`),
          //h('p.p_value-label-1', '.1'),
          h('p', '.5'),
          h('p', `1`)
        ])
      ]),
      h(TabPanel)
    ]);
  }
}
module.exports = EnrichmentMenu;