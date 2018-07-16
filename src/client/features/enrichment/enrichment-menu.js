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
            }, 'P-Value Legend')
        ])
      ]),
      h(TabPanel, [
        h('div.enrichment-legend-container', [
          h('div.enrichment-legend-stat-significant', [
            h('p', `0`),
            h('p', '.025'),
            h('p', `.05`)
          ]),
          h('div.enrichment-legend-not-significant', [
            h('p', `>.05`)
          ])
        ])
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;