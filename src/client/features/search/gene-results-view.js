const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const queryString = require('query-string');
const _ = require('lodash');

const { MAX_SIF_NODES, NS_HGNC_SYMBOL, NS_GENECARDS, NS_NCBI_GENE, NS_UNIPROT } = require('../../../config');

const SUPPORTED_COLLECTIONS = new Map([
  [NS_GENECARDS, 'GeneCards'],
  [NS_HGNC_SYMBOL, 'HGNC'],
  [NS_NCBI_GENE, 'NCBI Gene'],
  [NS_UNIPROT, 'UniProt']
]);

const getHgncFromXref = xrefLinks => {
  let symbol;
  const hgncXrefLink = _.find( xrefLinks, link  => link.namespace === NS_HGNC_SYMBOL );
  if( hgncXrefLink ) symbol = _.last( _.compact( hgncXrefLink.uri.split('/') ) );
  return symbol;
};

class EntitySummaryBox extends React.Component {
  render(){
    let { summary } = this.props;
    let { displayName, xrefLinks } = summary;
    const hgncSymbol = getHgncFromXref( xrefLinks );

    // sometimes duplicated namespace/uri pairs are received e.g. uniprot/tp53 twice
    let sortedLinks = _.uniqWith(xrefLinks.sort( (p1, p2) => p1.namespace > p2.namespace ? 1: -1 ), (p1, p2) => p1.namespace === p2.namespace )
        .map( link => h( 'a.plain-link', { href: link.uri, target:'_blank' }, SUPPORTED_COLLECTIONS.get( link.namespace ) ) );

        return (
      h('div.entity-summary-box', [
          h('h5.entity-subtitle', displayName),
          h('h3.entity-title', hgncSymbol),
        h('div.entity-links-container', [
          ...sortedLinks
        ])
      ])
    );

  }
}

class GeneResultsView extends React.Component {
  // get whether to show interactions or enrichment labels and links
  determineAppLinkout(){
    let { geneResults } = this.props;
    let sources = geneResults.map( summaryResult => getHgncFromXref( _.get( summaryResult, ['summary', 'xrefLinks'] ) ) );
    let appLabel;
    let appPath;

    if( sources.length === 1 ){
      appLabel = `View interactions between ${sources[0]} and top ${MAX_SIF_NODES} genes`;
      appPath = '/interactions';

      return { appPath, appLabel };
    }

    if( sources.length <= 3 ){
      appLabel = `View iteractions between ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
      appPath = '/interactions';

      return { appPath, appLabel };
    }

    appLabel = `View enrichment of ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
    appPath = '/enrichment';
    return { appPath, appLabel };
  }

  render(){
    let { geneResults } = this.props;
    let { appPath, appLabel } = this.determineAppLinkout();
    let sources = geneResults.map( summaryResult => getHgncFromXref( _.get( summaryResult, ['summary', 'xrefLinks'] ) ) );

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Genes (${geneResults.length})`),
      h('div.search-genes-info-panel', [
        h('div.search-genes-list', [
          ...geneResults.map( s => {
            return h('div.card', [
              h(EntitySummaryBox, { summary: _.get(s, `summary`) } )
            ]);
          })
        ]),
        h('div.search-genes-app-linkout', [
          h(Link, {
            to: {
              pathname: appPath,
              search: queryString.stringify({ source: sources.join(',') })
            },
            target: '_blank'
          }, appLabel)
        ])
      ])
    ]);
  }
}

module.exports = { GeneResultsView };