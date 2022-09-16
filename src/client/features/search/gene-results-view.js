const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');

const MIN_GENE_COUNT_ENRICHMENT = 5;
const { NS_HGNC_SYMBOL, NS_GENECARDS, NS_NCBI_GENE, NS_UNIPROT } = require('../../../config');
const { AppCard } = require('../../common/components');

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
  getEnrichmentAppInfo( geneResults, searchString ){
    let enabled = geneResults.length >= MIN_GENE_COUNT_ENRICHMENT;
    let hint = `Requires at least ${MIN_GENE_COUNT_ENRICHMENT} genes.`;
    let linkPath = '/enrichment';
    let url = `${linkPath}/?${searchString}`;
    let imageClass = 'enrichment-logo';
    let title = 'Enrichment';
    let body = 'Explore a network of pathways that contain genes identified in your query.';

    return { enabled, hint, url, imageClass, title, body };
  }

  getInteractionsAppInfo( geneResults, searchString ){
    let enabled = geneResults.length > 0;
    let hint = `Requires one recognized gene.`;
    let linkPath = '/interactions';
    let url = `${linkPath}/?${searchString}`;
    let imageClass = 'interactions-logo';
    let title = 'Interactions';
    let body = 'Visualize interactions between the genes identified in your query.';

    return { enabled, hint, url, imageClass, title, body };
  }

  render(){
    let { geneResults } = this.props;

    if( geneResults === null || geneResults.length === 0 ){
      return null;
    }

    let sources = geneResults.map( geneInfo => geneInfo.geneSymbol );
    let searchString = queryString.stringify({ source: sources.join(',') });

    const appsInfos = [
      this.getInteractionsAppInfo( geneResults, searchString ),
      this.getEnrichmentAppInfo( geneResults, searchString )
    ].map( info => h( AppCard, info ) );

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Recognized genes (${geneResults.length})`),
        h('div.search-genes-list', [
          ...geneResults.map( geneInfo => {
            return h('div.card', [
              h(EntitySummaryBox, { geneInfo } )
            ]);
          })
        ]),
        h( 'div.search-app-cards', appsInfos )
    ]);
  }
}

module.exports = { GeneResultsView };