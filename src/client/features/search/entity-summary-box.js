const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const config = require('../../../config');
let { DATASOURCES } = require('../../../models/entity/summary');

const ENTITY_OTHER_NAMES_LIMIT = 4;
const ENTITY_SUMMARY_DISPLAY_LIMIT = 6;

//Temporary - to be dealt with in #1116 (https://github.com/PathwayCommons/app-ui/issues/1116)
const DATASOURCE_NAMES = {
  [DATASOURCES.NCBIGENE]: {
    displayName: 'NCBI Gene',
    linkUrl: DATASOURCES.NCBIGENE
  },
  [DATASOURCES.HGNC]: {
    displayName: 'HGNC',
    linkUrl: 'http://identifiers.org/hgnc.symbol/'
  },
  [DATASOURCES.UNIPROT]: {
    displayName: 'UniProt',
    linkUrl: DATASOURCES.UNIPROT
  },
  [DATASOURCES.GENECARDS]: {
    displayName: 'GeneCards',
    linkUrl: 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='
  },
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
    let { dataSource, displayName, localID, description, aliasIds, xref } = summary;
    // Retrieve the HGNC symbol (http://www.pathwaycommons.org/sifgraph/swagger-ui.html)
    let hgncSymbol = summary.xref[ DATASOURCES.HGNC ] || localID; // Prefix is hgnc
    let sortedLinks = _.toPairs( xref ).concat([[ dataSource, localID ]])
        .sort( (p1, p2) => p1[0] > p2[0] ? 1: -1 )
        .map( pair => h('a.plain-link', { href: (DATASOURCE_NAMES[pair[0]]).linkUrl + pair[1], target:'_blank' }, (DATASOURCE_NAMES[pair[0]]).displayName));

    let moreInfo = h('div.entity-more-info',[
      h('div.entity-names', [
        h('div.entity-other-names', [
          h('h5', 'Other Names'),
          aliasIds.slice(0, ENTITY_OTHER_NAMES_LIMIT).join(', ')
        ])
      ]),
      description != '' ? h('div.entity-description', [
        h('h5', 'Description'),
        h('div', [ description ])
      ]) : null
    ]);

    return (
      h('div.entity-summary-box', [
        h('div.entity-summary-title', { onClick: () => this.setState({ expanded: !this.state.expanded }) }, [
          h('h3.entity-title', `${hgncSymbol}: ${displayName}`),
          ...sortedLinks,
          this.state.expanded ? h('i.material-icons', 'expand_more') : h('i.material-icons', 'keyboard_arrow_right')
        ]),
        this.state.expanded ? moreInfo : null
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

  componentDidMount(){
    let { entitySummaryResults } = this.props;
    let hgncSymbols = _.values( entitySummaryResults )
        .map( summary => summary.xref[ DATASOURCES.HGNC ] || summary.xref[ 'localID' ] ); // Prefix is hgnc


    fetch('/api/interactions/image?' + queryString.stringify({ sources: hgncSymbols })).then( r => r.json() ).then( res => {
      let { img } = res;
      this.setState({ img });
    });
  }

  render(){
    let { entitySummaryResults } = this.props;
    let { img } = this.state;
    const entitySummaryKeys = _.keys( entitySummaryResults );

    // Retrieve the HGNC symbol (http://www.pathwaycommons.org/sifgraph/swagger-ui.html)
    let sources = _.values( entitySummaryResults )
        .map( summary => summary.xref[ DATASOURCES.HGNC ] || summary.xref[ 'localID' ] ); // Prefix is hgnc

    let singleSrcLabel = `View interactions between ${sources[0]} and top ${config.MAX_SIF_NODES} genes`;
    let multiSrcLabel = `View iteractions between ${sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;

    let interactionsLinkLabel = sources.length === 1 ? singleSrcLabel : multiSrcLabel;

    let entitySummaryBoxes = entitySummaryKeys
       .slice( 0, ENTITY_SUMMARY_DISPLAY_LIMIT )
       .map( key => {
         const summary = _.get( entitySummaryResults, key );
         let props = { summary };
         return h(EntitySummaryBox, props);
       });

    return h('div.entity-summary-list', [
      h('div.entity-summary-view-interactions', [
        h(Link, {
          target: '_blank',
          className: 'entity-summary-interactions-snapshot-container',
          to: {
            pathname: '/interactions',
            search: queryString.stringify({ source: sources.join(',') })
          }
        }, [
          h('div.entity-summary-interactions-snapshot', { style: { backgroundImage: `url(${img})` } }),
          h('button.entity-summary-interactions-snapshot-button', {
            className: classNames('entity-summary-interactions-snapshot-button', entitySummaryKeys.length === 1 ? 'snapshot-button-center' : 'snapshot-button-left')
          }, [
            h('div', interactionsLinkLabel)
          ])
        ]),
        h('div.entity-summary-list-entries', entitySummaryBoxes),
      ])
    ]);
  }
}

module.exports = EntitySummaryBoxList;
