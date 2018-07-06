const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');

const GENE_OTHER_NAMES_LIMIT = 4;
const GENE_DESCRIPTION_WORD_LIMIT = 40;
const GENE_INFO_DISPLAY_LIMIT = 6;

class EntityInfoBox extends React.Component {
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

    let moreInfo = h('div.entity-more-info',[
      h('div.entity-names', [
        h('div.entity-official-symbol', [
          h('h4', 'Official Symbol'),
          officialSymbol
        ]),
        h('div.entity-other-names', [
          h('h4', 'Other Names'),
          otherNames.split(',').slice(0, GENE_OTHER_NAMES_LIMIT).join(',')
        ])
      ]),
      h('div.entity-description', [
        h('h4', 'Description'),
        this.state.descriptionExpanded ? description : description.split(' ', GENE_DESCRIPTION_WORD_LIMIT).join(' ') + '...'
      ]),
      h('div.entity-description-more', {
        onClick: () => {
          this.setState({descriptionExpanded: !this.state.descriptionExpanded});
        } }, [
        h('i.material-icons', this.state.descriptionExpanded ? 'expand_less' : 'expand_more'),
        !this.state.descriptionExpanded ? h('div', 'View full description') : h('div', 'Hide full description')
      ]),
      h('div.entity-links', [
        h('div.entity-links-container', links.map( link => h('a.plain-link.entity-info-link', { href: link.link, target:'_blank' }, link.displayName)))
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
class EntityInfoBoxList extends React.Component {

  render(){
    let { entityInfoList } = this.props;

    let interactionsLinkQuery = ents => queryString.stringify({source: ents.map( ent => ent.officalSymbol )});
    let viewMultipleInteractionsLink = (
      h(Link, {
          to: { pathname: '/interactions', search: interactionsLinkQuery(entityInfoList) },
          target: '_blank',
        }, [
        h('button.search-landing-button', 'View Interactions Between Entities')
      ])
    );

    let entityInfoBoxes = entityInfoList.slice(0, GENE_INFO_DISPLAY_LIMIT).map( (entity, index) => {
      let props = { entity };
      if( index === 0 ){
        props.expanded = true;
      }
      return h(EntityInfoBox, props);
    });


    return h('div.entity-info-list', [
      h('div.entity-info-list-entries', entityInfoBoxes)
    ]);
  }
}

module.exports = EntityInfoBoxList;
