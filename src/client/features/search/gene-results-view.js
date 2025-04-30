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
  render() {
    let { geneInfo } = this.props;
    let { geneSymbol, summary } = geneInfo;
    let { displayName, xrefLinks } = summary;

    // sometimes duplicated namespace/uri pairs are received e.g. uniprot/tp53 twice
    let sortedLinks = _.uniqWith(xrefLinks.sort((p1, p2) => p1.namespace > p2.namespace ? 1 : -1), (p1, p2) => p1.namespace === p2.namespace)
      .map(link => h('a.plain-link', { href: link.uri, target: '_blank' }, SUPPORTED_COLLECTIONS.get(link.namespace)));

    return h('div.entity-summary-box', [
      h('h5.entity-subtitle', displayName),
      h('h3.entity-title', geneSymbol),
      h('div.entity-links-container', [
        ...sortedLinks
      ])
    ]);
  }
}

class GeneResultsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showLeftButton: false,
      showRightButton: false
    };
    
    this.scrollContainerRef = React.createRef();
    this.itemWidth = 20; // in em units
    this.visibleItems = 3;
  }

  componentDidMount() {
    this.checkScroll();
    this.scrollContainerRef.current?.addEventListener('scroll', this.checkScroll);
  }

  componentWillUnmount() {
    this.scrollContainerRef.current?.removeEventListener('scroll', this.checkScroll);
  }

  checkScroll = () => {
    if (this.scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainerRef.current;
      const { geneResults } = this.props;
      this.setState({
        showLeftButton: scrollLeft > 0 && geneResults.length > this.visibleItems,
        showRightButton: scrollLeft < scrollWidth - clientWidth && geneResults.length > this.visibleItems
      });
    }
  }

  scroll = (direction) => {
    if (this.scrollContainerRef.current) {
      const container = this.scrollContainerRef.current;
      const cardWidth = container.querySelector('.card').offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollAmount = Math.floor(containerWidth / cardWidth) * cardWidth;
      
      const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }

  getEnrichmentAppInfo(geneResults, searchString) {
    let enabled = geneResults.length >= MIN_GENE_COUNT_ENRICHMENT;
    let hint = `Requires at least ${MIN_GENE_COUNT_ENRICHMENT} genes.`;
    let linkPath = '/enrichment';
    let url = `${linkPath}/?${searchString}`;
    let imageClass = 'enrichment-logo';
    let title = 'Enrichment';
    let body = 'Explore a network of pathways that contain genes identified in your query.';

    return { enabled, hint, url, imageClass, title, body, linkifyContent: true };
  }

  getInteractionsAppInfo(geneResults, searchString) {
    let enabled = geneResults.length > 0;
    let hint = `Requires one recognized gene.`;
    let linkPath = '/interactions';
    let url = `${linkPath}/?${searchString}`;
    let imageClass = 'interactions-logo';
    let title = 'Interactions';
    let body = 'Visualize interactions between the genes identified in your query.';

    return { enabled, hint, url, imageClass, title, body, linkifyContent: true };
  }

  render() {
    let { geneResults } = this.props;
    const { showLeftButton, showRightButton } = this.state;

    if (geneResults === null || geneResults.length === 0) {
      return null;
    }

    let sources = geneResults.map(geneInfo => geneInfo.geneSymbol);
    let searchString = queryString.stringify({ source: sources.join(',') });

    const appsInfos = [
      this.getInteractionsAppInfo(geneResults, searchString),
      this.getEnrichmentAppInfo(geneResults, searchString)
    ].map(info => h(AppCard, info));

    return h('div.search-genes-results', [
      h('h3.search-genes-header', `Recognized genes (${geneResults.length})`),
      h('div.search-genes-scroll-container', [
        showLeftButton && h('button.scroll-caret-button.left', {
          onClick: () => this.scroll('left'),
          disabled: !showLeftButton,
          className: showLeftButton ? 'active' : 'inactive'
        }, [
          h('i.icon.icon-chevron-left')
        ]),
        h('div.search-genes-list', {
          ref: this.scrollContainerRef,
          onScroll: this.checkScroll
        }, [
          ...geneResults.map(geneInfo => {
            return h('div.card', [
              h(EntitySummaryBox, { geneInfo })
            ]);
          })
        ]),
        showRightButton && h('button.scroll-caret-button.right', {
          onClick: () => this.scroll('right'),
          disabled: !showRightButton,
          className: showRightButton ? 'active' : 'inactive'
        }, [
          h('i.icon.icon-chevron-right')
        ])
      ]),
      h('div.search-app-cards', appsInfos)
    ]);
  }
}

module.exports = { GeneResultsView };