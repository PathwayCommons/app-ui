const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');

const config = require('../../../config');
let { DATASOURCES } = require('../../../models/entity/summary');

const GENE_OTHER_NAMES_LIMIT = 4;
const GENE_DESCRIPTION_WORD_LIMIT = 40;
const GENE_INFO_DISPLAY_LIMIT = 6;

class EntitySummaryBox extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      expanded: props.expanded || false,
      descriptionExpanded: false
    };

  }
  render(){
    let { entity } = this.props;
    let { name, officialSymbol, otherNames, links, function: description } = entity;

    let sortedLinks = links.sort((l1, l2) => l1.displayName > l2.displayName).map( link => h('a.plain-link.entity-info-link', { href: link.link, target:'_blank' }, link.displayName));

    let collapsedDescription = descrTxt => {
      let tokens = descrTxt.split(' ');
      if( tokens.length <= GENE_DESCRIPTION_WORD_LIMIT ){
        return descrTxt;
      }

      return tokens.slice(0, GENE_DESCRIPTION_WORD_LIMIT).join(' ') + '...';
    };

    let moreInfo = h('div.entity-more-info',[
      h('div.entity-names', [
        h('div.entity-official-symbol', [
          h('h5', 'Official Symbol'),
          officialSymbol
        ]),
        h('div.entity-other-names', [
          h('h5', 'Other Names'),
          otherNames.split(',').slice(0, GENE_OTHER_NAMES_LIMIT).join(',')
        ])
      ]),
      description != '' ? h('div.entity-description', [
        h('h5', 'Description'),
        h('div', [
          this.state.descriptionExpanded ? description : collapsedDescription(description)
        ]),
        h('div.entity-description-more', {
          onClick: () => {
            this.setState({descriptionExpanded: !this.state.descriptionExpanded});
          } }, [
          h('i.material-icons', this.state.descriptionExpanded ? 'expand_less' : 'expand_more'),
          !this.state.descriptionExpanded ? h('div', 'View full description') : h('div', 'Hide full description')
        ])
      ]) : null,
      h('div.entity-links', [
        h('div.entity-links-container', sortedLinks)
      ])
    ]);

    return (
      h('div.entity-info-box', [
        h('div.entity-info-title', { onClick: () => this.setState({ expanded: !this.state.expanded }) }, [
          h('h3.entity-title', name),
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

  render(){
    let { entitySummaryResults } = this.props;
    const entitySummaryKeys = _.keys( entitySummaryResults );

    // Retrieve the HGNC symbol (http://www.pathwaycommons.org/sifgraph/swagger-ui.html)
    let getHGNCSymbols = summaries => _.values( summaries )
        .map( summary => summary.xref[ DATASOURCES.HGNC ] || summary.xref[ 'localID' ] ); // Prefix is hgnc

    let interactionsLinkLabel = sources => {
      if( sources.length === 1 ){
        return `Interactions between ${sources[0]} and top ${config.MAX_SIF_NODES} genes`;
      }

      return `Interactions between ${ sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`;
    };

    let ViewMultipleInteractionsEntry = () => {
      const hgncSymbols = getHGNCSymbols( entitySummaryResults );
      return h('div.search-item', [
        h('div.search-item-icon',[
           h('img', { src: '/img/icon.png' })
         ]),
         h('div.search-item-content', [
           h(Link, {
             className: 'plain-link',
             to: { pathname: '/interactions', search: queryString.stringify({ source: hgncSymbols.join(',') }) },
             target: '_blank'
            }, interactionsLinkLabel( hgncSymbols )),
           h('p.search-item-content-datasource', 'Pathway Commons')
         ])
       ]);
    };

    let entitySummaryBoxes = () => {
      entitySummaryKeys
       .slice( 0, GENE_INFO_DISPLAY_LIMIT )
       .map( ( key, index ) => {
         const summary = _.get( entitySummaryResults, key );
         let props = { summary };
         if( index === 0 ){
           props.expanded = true;
         }
         return h(EntitySummaryBox, props);
       });
    };

    return h('div.entity-info-list', [
      h('div.entity-info-list-entries', entitySummaryBoxes),
      entitySummaryKeys.length != 0 ? h('div.entity-info-view-interactions', [
        h(ViewMultipleInteractionsEntry)
       ]) : null
    ]);
  }
}

module.exports = EntitySummaryBoxList;