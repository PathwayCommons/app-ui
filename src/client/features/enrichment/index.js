const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

const ValidatorUI = require('./validator');
const EMapUI = require('./emap');
const EnrichmentUI = require('./enrichment');


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
          h('div', [
            h(ValidatorUI)
          ])
        ]),
        h(TabPanel, [
          h('div', [
            h(EnrichmentUI)
          ])
        ]),
        h(TabPanel, [
          h('div', [
            h(EMapUI)
          ])
        ]),
      ])
    ]);
  }
}
module.exports = EnrichmentMap;