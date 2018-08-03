const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');


class EnrichmentTooltip extends React.Component {
  render(){
    let {node, overviewDesc}= this.props;
    let title = node.data('description');
    let id = node.data('id');
    let sharedGeneList = node.data('intersection');
    let sharedGeneCount = sharedGeneList.length;
    let geneCount = node.data('geneCount');
    let geneSet = node.data('geneSet');
    let dbInfo = {};

    if( id.includes('GO') ) dbInfo = {name: 'Gene Ontology', url:'http://identifiers.org/go/' + id};
    else dbInfo = {name: 'Reactome', url:'http://identifiers.org/reactome/' + id.replace("REAC:", "R-HSA-") };

    return h('div.enrichment-tooltip', [
      h('div.enrichment-tooltip-header',[
        h('h2.enrichment-tooltip-title', title)
      ]),
      h('div.enrichment-tooltip-body', [
        h('div.enrichment-tooltip-field-name', 'Pathway Overview'),
        h('div.enrichment-tooltip-field-value', overviewDesc),
        h('div.enrichment-tooltip-field-name', 'Genes Shared with Entered List (' + sharedGeneCount + ')'),
        h('div.enrichment-tooltip-field-value', sharedGeneList.join(', ')),
        h('div.enrichment-tooltip-field-name', 'Genes in Pathway (' + geneCount + ')'),
        h('div.enrichment-tooltip-field-value', geneSet.join(', ')),
      ]),
      h('div.enrichment-tooltip-footer', [
        h('a.plain-link', { href: dbInfo.url, target: '_blank', }, dbInfo.name)
      ])
    ]);
  }
}

module.exports = EnrichmentTooltip;