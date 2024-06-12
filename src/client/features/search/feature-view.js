const React = require('react');
const h = require('react-hyperscript');
const { AppCard } = require('../../common/components');
const _ = require('lodash');

const {
  NS_BIOFACTOID,
  NS_PATHWAYCOMMONS
} = require('../../../config');

class FeatureView extends React.Component {

  render(){

    const { feature } = this.props;
    if( feature == null ) return null;

    const MAX_AUTHORS = 8;

    const { article, pathways, authors } = feature;
    const pcPathway = _.find( pathways, ['db', NS_PATHWAYCOMMONS] );
    const biofactoidPathway = _.find( pathways, ['db', NS_BIOFACTOID] );

    // Card Content
    const body = biofactoidPathway.text;

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
        h('div.feature-area.pathway', [
          h('div.feature-item', [
            h(AppCard, {
              url: biofactoidPathway.url,
              image: h('img', { src: biofactoidPathway.imageSrc }),
              title: h('div', [
                h('i.icon.logo-biofactoid'),
                biofactoidPathway.organism ? h('span', biofactoidPathway.organism ) : null
              ]),
              body
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
            h('div.horizontal-list.feature-detail.feature-detail-links',
              [
                h('div.feature-detail-link', [
                  article.doiUrl ?
                    h('a.plain-link', { href: article.doiUrl, target: '_blank' }, article.reference ) :
                    h( 'span', article.reference ),
                ]),
                h('div.feature-detail-link', [
                  article.pubmedUrl ?
                    h('a.plain-link', { href: article.pubmedUrl, target: '_blank' }, 'PubMed' ) :
                    null
                ])
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