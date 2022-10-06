const React = require('react');
const h = require('react-hyperscript');
const { AppCard } = require('../../common/components');
const _ = require('lodash');

const {
  NS_BIOFACTOID,
  NS_PATHWAYCOMMONS,
  NS_NCBI_GENE,
  NS_CHEBI,
  FACTOID_URL
} = require('../../../config');

class FeatureView extends React.Component {

  render(){

    const { feature } = this.props;
    if( feature == null ) return null;

    const MAX_AUTHORS = 20;

    const { article, pathways, entities, authors } = feature;
    const pcPathway = _.find( pathways, ['db', NS_PATHWAYCOMMONS] );
    const biofactoidPathway = _.find( pathways, ['db', NS_BIOFACTOID] );

    // Card Content
    const pathwayTextComponent = biofactoidPathway.text.map( ({ title, body }) => {
      return h( 'p', [
        h('span.sub-heading', title),
        h('span', body)
      ]);
    });

    const entityComponent = h( 'p', [
      h('span.sub-heading', 'Genes & Chemicals'),
      h('ul.horizontal-list',
        entities.map( ({ label, url, dbPrefix }) => {
          let icon = null;
          if ( dbPrefix.toLowerCase() === NS_NCBI_GENE.toLowerCase() ) {
            icon = h('i.icon.icon-ncbi');
          } else if ( dbPrefix.toLowerCase() === NS_CHEBI.toLowerCase() ) {
            icon = h('i.icon.icon-chebi');
          }
          return h( 'li', [
            h('a.plain-link', { href: url, target: '_blank' }, label ),
            icon
          ]);
      }))
    ]);

    const cardBody = _.concat( entityComponent, pathwayTextComponent );

    // Authors
    let authorList = authors.map( ({ url: href, label }, key) => {
      let element = null;
      if( href ){
        element = [
          h('a.plain-link', { href, target: '_blank' }, `${label} ` ),
          h('i.icon.icon-orcid')
        ];
      } else {
        element = h( 'span', label );
      }
      return h('li', { key }, element );
    });
    if ( authorList.length > MAX_AUTHORS ){ // Abbreviate when necessary
      const numFromStart = Math.floor( MAX_AUTHORS / 2 );
      const numFromEnd = Math.ceil( MAX_AUTHORS / 2 );
      authorList = _.concat(
        _.take( authorList, numFromStart ),
        h('li', '...'),
        _.takeRight( authorList, numFromEnd )
      );
    }

    return (
      h('div.feature-container', [
        h('div.feature-area.header', [
          h('h3', [
            h('span', 'Pathway curated by author (via '),
            h('a.plain-link', {
              href: FACTOID_URL,
              target: '_blank'
            }, [
              h('span', 'biofactoid.org')
            ]),
            h('span', ')')
          ])
        ]),
        h('div.feature-area.pathway', [
          h('div.feature-item', [
            h(AppCard, {
              url: biofactoidPathway.url,
              image: h('img', { src: biofactoidPathway.imageSrc }),
              title: h('div', [
                h('i.icon.logo-biofactoid'),
                biofactoidPathway.organism ? h('span', biofactoidPathway.organism ) : null
              ]),
              body: h('div', cardBody )
            }),
            h('a.plain-link', {
              href: `/pathways?uri=${pcPathway.url}`,
              target: '_blank'
            }, 'Detailed pathway view (SBGN)')
          ])
        ]),
        h('div.feature-area.article', [
          h('div.feature-item', [
            h('div.headline', article.title ),
            h('ul.horizontal-list.feature-detail', authorList ),
            h('div.feature-item-row.feature-detail',
              [
                h('div', [
                  article.doiUrl ?
                    h('a.plain-link', { href: article.doiUrl, target: '_blank' }, article.reference ) :
                    h( 'span', article.reference ),
                ]),
                article.pubmedUrl ? h('div', [
                    h('a', { href: article.pubmedUrl, target: '_blank' }, h('i.icon.logo-pubmed') )
                  ]) : null
              ]
            )
          ])
        ]),
        h('div.feature-area.footer', [ h('hr') ] )
      ])
    );
  }
}

module.exports = { FeatureView };