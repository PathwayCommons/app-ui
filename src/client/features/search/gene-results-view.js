const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const queryString = require('query-string');
const _ = require('lodash');

const { NS_HGNC_SYMBOL, NS_GENECARDS, NS_NCBI_GENE, NS_UNIPROT } = require('../../../config');

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
  getEnrichmentAppInfo(){
    let label = `View`;
    let linkPath = '/enrichment';
    let description = 'Explore a network of pathways that contain genes identified in your query.';
    let imageClass = 'enrichment-logo';
    let title = 'Enrichment';

    return { label, title, linkPath, description, imageClass };
  }

  getInteractionsAppInfo(){
    let label = `View`;
    let description = 'Visualize interactions between the genes identified in your query.';
    let linkPath = '/interactions';
    let imageClass = 'interactions-logo';
    let title = 'Interactions';

    return { label, title, linkPath, description, imageClass };
  }

  render(){
    let { geneResults } = this.props;

    if( geneResults === null || geneResults.length === 0 ){
      return null;
    }

    let sources = geneResults.map( geneInfo => geneInfo.geneSymbol );
    let interactionsAppInfo = this.getInteractionsAppInfo( );
    let enrichmentAppInfo = this.getEnrichmentAppInfo( );

    let AppLinkout = appInfo => {
      let { linkPath, imageClass, title, description } = appInfo;

      let appLink = h(Link, {
        to: {
          pathname: linkPath,
          search: queryString.stringify({ source: sources.join(',') })
        },
        target: '_blank'
      }, [ h(`div.app-image.${imageClass}`) ] );

      return h('div.app-linkout', [
        appLink,
        h('div.app-linkout-content', [
          h('h4.app-title', title),
          h('div.app-description', description)
        ])
      ]);
    };

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Recognized genes (${geneResults.length})`),
        h('div.search-genes-list', [
          ...geneResults.map( geneInfo => {
            return h('div.card', [
              h(EntitySummaryBox, { geneInfo } )
            ]);
          })
        ]),
        h('div.app-linkouts', [
          h(AppLinkout, interactionsAppInfo),
          h(AppLinkout, enrichmentAppInfo)
        ])
    ]);
  }
}

module.exports = { GeneResultsView };