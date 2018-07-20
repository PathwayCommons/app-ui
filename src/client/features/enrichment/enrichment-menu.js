const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

class EnrichmentMenu extends React.Component {

  render(){
    return h(Tabs, [
      h('div.enrichment-drawer-header', [
        h('h2', 'Enriched Network'),
        h(TabList, [
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
            }, 'Legend')
        ])
      ]),
      h(TabPanel, [
        h('h4', 'Significance'),
        h('div.enrichment-legend-container', [
          h('div.enrichment-legend-stat-significant', [
            h('p', `high 0`),
            h('p', '.025'),
            h('p', `low .05`)
          ]),
          h('div.enrichment-legend-not-significant', [
            h('p', ` none >.05`)
          ])
        ])
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;