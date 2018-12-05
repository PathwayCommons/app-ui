const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const { fetch } = require('../../../util');
const { MAX_SIF_NODES, NS_HGNC_SYMBOL, NS_GENECARDS, NS_NCBI_GENE, NS_UNIPROT } = require('../../../config');

const ENTITY_OTHER_NAMES_LIMIT = 4;
const ENTITY_SUMMARY_DISPLAY_LIMIT = 6;

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
  constructor(props){
    super(props);

    this.state = {
      expanded: props.expanded || false
    };

  }
  render(){
    let { summary } = this.props;
    let { displayName, aliasIds, xrefLinks } = summary;
    const hgncSymbol = getHgncFromXref( xrefLinks );

    // sometimes duplicated namespace/uri pairs are received e.g. uniprot/tp53 twice
    let sortedLinks = _.uniqWith(xrefLinks.sort( (p1, p2) => p1.namespace > p2.namespace ? 1: -1 ), (p1, p2) => p1.namespace === p2.namespace )
        .map( link => h( 'a.plain-link', { href: link.uri, target:'_blank' }, SUPPORTED_COLLECTIONS.get( link.namespace ) ) );

        return (
      h('div.entity-summary-box', [
          h('h5.entity-subtitle', displayName),
          h('h3.entity-title', hgncSymbol),
        h('div.entity-names', [
          h('div.entity-other-names', [
            h('h5', 'Other Names'),
            aliasIds.slice(0, ENTITY_OTHER_NAMES_LIMIT).join(', ')
          ])
        ]),
        h('h5', 'Learn more'),
        h('div.entity-links-container', [
          ...sortedLinks


        ])
      ])
    );

  }
}

// props:
//  - entityQuery (List of strings representing genes)
class EntitySummaryBoxList extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      img: ''
    };
  }

  getInteractionsPreviewImage( sources ){
    let { img } = this.state;
    if( img ){ return `url(${img})`; }

    let numSources = sources.length;

    if( numSources === 1 ){
      return `url(${'/img/interactions-placeholder-single.png'})`;
    }

    if( numSources === 2 ){
      return `url(${'/img/interactions-placeholder-double.png'})`;
    }

    if( numSources === 3 ){
      return `url(${'img/interactions-placeholder-triple.png'})`;
    }
  }

  componentDidMount(){
    let { entitySummaryResults } = this.props;
    let hgncSymbols = entitySummaryResults.map( summaryResult => getHgncFromXref( _.get( summaryResult, ['summary', 'xrefLinks'] ) ) );

    fetch('/api/interactions/image?' + queryString.stringify({ sources: hgncSymbols })).then( r => r.json() ).then( res => {
      let { img } = res;
      this.setState({ img });
    });
  }

  render(){
    let { entitySummaryResults } = this.props;
    let sources = entitySummaryResults.map( summaryResult => getHgncFromXref( _.get( summaryResult, ['summary', 'xrefLinks'] ) ) );
    let singleSrcLabel = `View interactions between ${sources[0]} and top ${MAX_SIF_NODES} genes`;
    let multiSrcLabel = `View iteractions between ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
    let interactionsLinkLabel = sources.length === 1 ? singleSrcLabel : multiSrcLabel;

    let entitySummaryBoxes = entitySummaryResults
       .slice( 0, ENTITY_SUMMARY_DISPLAY_LIMIT )
       .map( summaryResult => {
         const summary = _.get( summaryResult, 'summary' );
         let props = { summary };
         return h(EntitySummaryBox, props);
       });

    let img = this.getInteractionsPreviewImage(sources);

    return h('div.entity-summary-list', [
      h('div.enrichment-link', [
        h(Link, {
          target: '_blank',
          to: {
            pathname: '/enrichment',
            search: queryString.stringify({ source: sources.join(',')})
          }
        }, 'Enrichment')
      ]),
      h('div.entity-summary-view-interactions', [
        h(Link, {
          target: '_blank',
          className: 'entity-summary-interactions-snapshot-container',
          to: {
            pathname: '/interactions',
            search: queryString.stringify({ source: sources.join(',') })
          }
        }, [
          h('div.entity-summary-interactions-snapshot', { style: { backgroundImage: img } }),
          h('button.entity-summary-interactions-snapshot-button', {
            className: classNames('entity-summary-interactions-snapshot-button', sources.length === 1 ? 'snapshot-button-center' : 'snapshot-button-left')
          }, [
            h('div', interactionsLinkLabel)
          ])
        ]),
        h('div.entity-summary-list-entries', entitySummaryBoxes)
      ])
    ]);
  }
}

module.exports = { EntitySummaryBoxList, EntitySummaryBox };
