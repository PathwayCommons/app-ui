const React = require('react');
const h = require('react-hyperscript');

class EnrichmentNodeTooltip extends React.Component {
  render(){
    let {node, overviewDesc} = this.props;
    let title = node.data('description');
    let id = node.data('id');
    let sharedGeneList = node.data('intersection').sort();
    let sharedGeneCount = sharedGeneList.length;
    let geneSet = node.data('geneSet').sort();
    let geneCount = node.data('geneCount');
    let dbInfo = {};

    if( id.includes('GO') ) dbInfo = {name: 'Gene Ontology', url:'http://identifiers.org/go/' + id};
    else if( id.includes('REAC') ) dbInfo = {name: 'Reactome', url:'http://identifiers.org/reactome/' + id.replace("REAC:", "R-HSA-") };

    return h('div.enrichment-tooltip', [
      h('div.enrichment-tooltip-header',[
        h('h2.enrichment-tooltip-title', title)
      ]),
      h('div.enrichment-tooltip-body', [
        h('div.enrichment-pathway-overview', [
          h('div.enrichment-tooltip-field-name', 'Pathway Overview'),
          h('div.enrichment-tooltip-field-value', overviewDesc)
        ]),
        h('div.enrichment-tooltip-field-name', 'Genes Shared with Entered List (' + sharedGeneCount + ')'),
        h('div.enrichment-tooltip-field-value', sharedGeneList.join(', ')),
        h('div.enrichment-tooltip-field-name', 'Genes in Pathway (' + geneCount + ')'),
        h('div.enrichment-tooltip-field-value', geneSet.join(', ')),
      ]),
      h('div.enrichment-tooltip-footer', [
        h('a.plain-link', { href: dbInfo.url, target: '_blank', }, dbInfo.name)
      ]),
      h('div.enrichment-search-PC-call-to-action', [
        h('a.enrichment-search-PC', {
          target: '_blank',
          href: '/search?q=' + title
          },
          `SEARCH PATHWAY`
        )
      ])
    ]);
  }
}

module.exports = EnrichmentNodeTooltip;