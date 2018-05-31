const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

const ValidatorUI = require('./validator');
const EMapUI = require('./emap');
const EnrichmentUI = require('./enrichment');


class EnrichmentMap extends React.Component {
  render() {
    //test title to verify that page has loaded
    return h('div', "Enrichment");
  }
}
module.exports = EnrichmentMap;