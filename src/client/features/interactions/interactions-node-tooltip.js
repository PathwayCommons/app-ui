const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { NS_GENECARDS, NS_NCBI_GENE, NS_HGNC_SYMBOL, NS_UNIPROT } = require('../../../config');

class InteractionsNodeTooltip extends React.Component {
  render(){
    let { node, geneMetadata } = this.props;
    let xrefLinks = _.get(geneMetadata, 'summary.xrefLinks', []);
    let description = _.get(geneMetadata, 'summary.description', '');
    let aliases = _.get(geneMetadata, 'summary.aliases', []);

    let title = node.data('id');
    let links = [];

    links.push({ name: 'HGNC', url: xrefLinks.find( link => link.namespace === NS_HGNC_SYMBOL ).uri });
    links.push({ name: 'UniProt', url: xrefLinks.find( link => link.namespace === NS_UNIPROT ).uri });
    links.push({ name: 'NCBI Gene', url: xrefLinks.find( link => link.namespace === NS_NCBI_GENE ).uri });
    links.push({ name: 'Gene Cards', url: xrefLinks.find( link => link.namespace === NS_GENECARDS ).uri });

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header', [
        h('h2.cy-tooltip-title', title )
      ]),
      h('div.cy-tooltip-body', [
        aliases.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Other names'),
          ...aliases.slice(0, 3).map( alias => h('div.cy-tooltip-field-value', alias) )
        ]) : null,
        description != '' ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Description'),
          h('div.cy-tooltip-field-value', description)
        ]) : null
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
      h('div.cy-tooltip-call-to-action', [
        h('a', {
          target: '_blank',
          href: '/search?q=' + title
        }, [
          h('button.call-to-action', `Find Related Pathways`)
        ])
      ])
    ]);
  }
}

module.exports = InteractionsNodeTooltip;