const React = require('react');
const h = require('react-hyperscript');

class InteractionsNodeTooltip extends React.Component {
  render(){
    let { node } = this.props;
    let title = node.data('id');
    let types = node.data('types');
    let externalIds = node.data('externalIds');

    let links = [];

    let uniprotId = externalIds['uniprot knowledgebase'];
    if( uniprotId != null ){
      links.push({ name: 'Uniprot', url: 'http://identifiers.org/uniprot/' + externalIds['uniprot knowledgebase'] });
    }

    let hgncSymbolId = externalIds['hgnc symbol'];
    if( hgncSymbolId != null ){
      links.push({ name: 'HGNC Symbol', url: 'http://identifiers.org/hgnc.symbol/' + externalIds['hgnc symbol'] });
    }

    let ncbiGeneId = externalIds['ncbi gene'];
    if( ncbiGeneId != null ){
      links.push({ name: 'NCBI Gene', url: 'http://identifiers.org/ncbigene/' + externalIds['ncbi gene'] });
    }

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header', [
        h('h2.cy-tooltip-title', title),
        h('div.cy-tooltip-type-chip', types[0])
      ]),
      links.length > 0 ? h('div.cy-tooltip-footer', [
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', [
            'Links'
          ]),
          h('div.cy-tooltip-links', links.map(link => {
            let { name, url } = link;

            return h('a.plain-link', { href: url, target: '_blank'  }, name);
          }))
        ])
      ]) : null,
      h('div.cy-tooltip-call-to-action', {
        target: '_blank',
        href: '/search?q=' + title
      }, [
        h('button.call-to-action', `Find Related Pathways`)
      ])
    ]);
  }
}

module.exports = InteractionsNodeTooltip;