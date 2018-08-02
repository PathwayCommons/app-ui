const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');


class EnrichmentTooltip extends React.Component {
  render(){
    let { title, overviewDesc, sharedGeneList, genesInPathway, dbInfo } = this.props;

    return h('div.enrichment-tooltip', [
      h('h2.enrichment-tooltip-title', title),
      h('div.enrichment-tooltip-header', 'Pathway Overview'),
      h('div.enrichment-tooltip-section', overviewDesc),
      h('div.enrichment-tooltip-header', 'Genes Shared with Entered List'),
      h('div.enrichment-tooltip-section', sharedGeneList.join(' ')),
      h('div.enrichment-tooltip-header', 'Genes in Pathway'),
      h('div.enrichment-tooltip-section', genesInPathway.join(',')),
      h('a', { href: dbInfo.url }, dbInfo.name)
    ]);
  }
}

module.exports = EnrichmentTooltip;