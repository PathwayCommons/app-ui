const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const MIN_GENE_COUNT_ENRICHMENT = 5;
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
  getEnrichmentAppInfo( geneResults ){
    let label = `View`;
    let linkPath = '/enrichment';
    let description = 'Explore a network of pathways that contain genes identified in your query.';
    let hint = `Requires at least ${MIN_GENE_COUNT_ENRICHMENT} genes.`;
    let imageClass = 'enrichment-logo';
    let title = 'Enrichment';
    let enabled = geneResults.length >= MIN_GENE_COUNT_ENRICHMENT;

    return { label, title, linkPath, description, hint, imageClass, enabled };
  }

  getInteractionsAppInfo( geneResults ){
    let label = `View`;
    let description = 'Visualize interactions between the genes identified in your query.';
    let hint = `Requires one recognized gene.`;
    let linkPath = '/interactions';
    let imageClass = 'interactions-logo';
    let title = 'Interactions';
    let enabled = geneResults.length > 0;

    return { label, title, linkPath, description, hint, imageClass, enabled };
  }

  render(){
    let { geneResults } = this.props;

    if( geneResults === null || geneResults.length === 0 ){
      return null;
    }

    let sources = geneResults.map( geneInfo => geneInfo.geneSymbol );
    let AppLinkout = appInfo => {
      let { linkPath, imageClass, title, description, enabled, hint } = appInfo;

      let img = h( `div.app-image.${imageClass}` );
      let appImage = h( Link,{ to: { pathname: linkPath, search: queryString.stringify({ source: sources.join(',') }) }, target: '_blank' }, [ img ]);
      let appHeader = h( 'div.app-header', [ h( 'h4.app-title', title ) ] );
      let appDescription = h( 'div.app-description', description );

      if( !enabled ){
        appImage = img;
        appHeader = h( 'div.app-header', [
          h( 'h4.app-title', title ),
          h( 'span.app-hint', hint )
        ]);
      }

      return h('.app-linkout', {
          className: classNames({
            'app-linkout-disabled': !enabled
          })
        }, [
        appImage,
        h('div.app-linkout-content', [
          appHeader,
          appDescription
        ])
      ]);
    };

    const appsLinkouts = [
      this.getInteractionsAppInfo( geneResults ),
      this.getEnrichmentAppInfo( geneResults )
    ].map( info => h( AppLinkout, info ) );

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Recognized genes (${geneResults.length})`),
        h('div.search-genes-list', [
          ...geneResults.map( geneInfo => {
            return h('div.card', [
              h(EntitySummaryBox, { geneInfo } )
            ]);
          })
        ]),
        h( 'div.app-linkouts', appsLinkouts )
    ]);
  }
}

module.exports = { GeneResultsView };