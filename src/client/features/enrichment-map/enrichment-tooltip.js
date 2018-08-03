const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');


class EnrichmentTooltip extends React.Component {
  render(){
    let {node, overviewDesc}= this.props;
    let title = node.data('description');
    let sharedGeneList = node.data('intersection');
    let genesInPathway = node.data('intersection');
    let geneCount = node.data('geneCount');

    return h('div.enrichment-tooltip', [
      h('div.enrichment-tooltip-header',[
        h('h2.enrichment-tooltip-title', title)
      ]),
      h('div.enrichment-tooltip-body', [
        h('div.enrichment-tooltip-field-name', 'Pathway Overview'),
        h('div.enrichment-tooltip-field-value', overviewDesc),
        h('div.enrichment-tooltip-field-name', 'Genes Shared with Entered List (' + sharedGeneList.length + ')'),
        h('div.enrichment-tooltip-field-value', sharedGeneList.join(' ')),
        h('div.enrichment-tooltip-field-name', 'Genes in Pathway (' + geneCount + ')'),
        h('div.enrichment-tooltip-field-value', genesInPathway.join(',')),
        // h('a', { href: dbInfo.url }, dbInfo.name)
      ])
    ]);
  }
}

module.exports = EnrichmentTooltip;