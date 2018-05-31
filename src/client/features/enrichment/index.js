const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');
const Loader = require('react-loader');

class EnrichmentMap extends React.Component {
  render() {
    //test title to verify that page has loaded, will appear in top right corner
    return h('div', "Enrichment");
  }
}
module.exports = EnrichmentMap;