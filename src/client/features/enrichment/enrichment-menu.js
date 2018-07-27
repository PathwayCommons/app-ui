const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const _ = require('lodash');

class EnrichmentMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      unrecognized: this.props.unrecognized
    };
  }
  render(){

    const unrecognized = this.state.unrecognized;

    const unrecognizedTokens = _.isEmpty(unrecognized) ? "" :
    [
      h('h3', 'Unrecognized Genes (' + unrecognized.length + ')'),
      h('div', unrecognized.join(", "))
    ];

    return h(Tabs, [
      h('div.enrichment-drawer-header', [
        h('h2', 'Enriched Network'),
        h(TabList, [
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
            }, 'Data')
        ])
      ]),
      h(TabPanel, [
        h('h3', 'P-Value Cutoff'),
        h('div.enrichment-legend-container', [
          h('div.enrichment-legend-stat-significant', [
            h('p', `high 0`),
            h('p', '.025'),
            h('p', `low .05`)
          ]),
          h('div.enrichment-legend-not-significant', [
            h('p', ` none >.05`)
          ])
        ]),
        h('div.unrecognized-token-container', unrecognizedTokens)
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;