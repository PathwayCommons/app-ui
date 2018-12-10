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

class EntitySummaryBox extends React.Component {
  render(){
    let { geneInfo } = this.props;
    let { geneSymbol, summary } = geneInfo;
    let { displayName, xrefLinks } = summary;

    // sometimes duplicated namespace/uri pairs are received e.g. uniprot/tp53 twice
    let sortedLinks = _.uniqWith(xrefLinks.sort( (p1, p2) => p1.namespace > p2.namespace ? 1: -1 ), (p1, p2) => p1.namespace === p2.namespace )
        .map( link => h( 'a.plain-link', { href: link.uri, target:'_blank' }, SUPPORTED_COLLECTIONS.get( link.namespace ) ) );

        return (
      h('div.entity-summary-box', [
          h('h5.entity-subtitle', displayName),
          h('h3.entity-title', geneSymbol),
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
    let createEnrichmentAppInfo = sources => {
      let label = `View enrichment of ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
      let linkPath = '/enrichment';
      let description = 'Placeholder info text for describing enrichment';
      let imageClass = 'enrichment-logo';
      let title = 'Enrichment';

      return { label, title, linkPath, description, imageClass };
    };

    let createInteractionsAppInfo = sources => {
      let label = `View interactions between ${sources[0]} and top ${MAX_SIF_NODES} genes`;
      let description = 'Placeholder info text for describing interactions';
      let linkPath = '/interactions';
      let imageClass = 'interactions-logo';
      let title = 'Interactions';

      if( sources.length === 1 ){
        label = `View iteractions between ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
      }

      return { label, title, linkPath, description, imageClass };
    };

    let { geneResults } = this.props;
    let sources = geneResults.map( geneInfo => geneInfo.geneSymbol );

    return sources.length < 4 ? createInteractionsAppInfo(sources) : createEnrichmentAppInfo(sources);
  }

  render(){
    let { geneResults } = this.props;
    let { label, title, linkPath, description, imageClass } = this.determineAppLinkout();
    let sources = geneResults.map( geneInfo => geneInfo.geneSymbol );

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Genes (${geneResults.length})`),
      h('div.search-genes-info-panel', [
        h('div.search-genes-list', [
          ...geneResults.map( geneInfo => {
            return h('div.card', [
              h(EntitySummaryBox, { geneInfo } )
            ]);
          })
        ]),
        h(Link, {
          to: {
            pathname: linkPath,
            search: queryString.stringify({ source: sources.join(',') })
          },
          target: '_blank'
        }, [
          h('div.search-genes-app-linkout', [
            h(`div.app-image.${imageClass}`),
            h('h4.app-title', title),
            h('div.search-genes-app-description', description),
            h('button.call-to-action', label)
          ])
        ])
      ])
    ]);
  }
}

module.exports = { GeneResultsView };