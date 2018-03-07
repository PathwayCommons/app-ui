const React = require('react');
const h = require('react-hyperscript');
const {Tab, Tabs, TabList, TabPanel} = require('react-tabs');

class EnrichmentMap extends React.Component {
  render() {
    return h('div', [
      h(Tabs, [
        h(TabList, [
          h(Tab, 'Validator'),
          h(Tab, 'Enrichment'),
          h(Tab, 'EMap')
        ]),
        h(TabPanel, [
          h('div', 'Validator skeleton')
        ]),
        h(TabPanel, [
          h('div', 'Enrichment skeleton')
        ]),
        h(TabPanel, [
          h('div', 'EMap skeleton')
        ]),
      ])
    ]);
  }
}
module.exports = EnrichmentMap;