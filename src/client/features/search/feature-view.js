const React = require('react');
const h = require('react-hyperscript');
const { AppCard } = require('../../common/components');
const _ = require('lodash');

const { NS_BIOFACTOID, NS_PATHWAYCOMMONS, FACTOID_URL } = require('../../../config');

class Logo extends React.Component {
  render(){
    const { className, label } = this.props;
    return h('div.logo', [
      h(`${className}.logo-icon`),
      label ? h('div.logo-label', label) : null
    ]);
  }
}

class FeatureItem extends React.Component {
  render(){
    const { title, items, sources, limit } = this.props;

    const sourceComponents = sources.map( ({ label, className }) => {
      return h('div', [
        h( Logo, { className, label })
      ]);
    });

    const itemComponents = items.map( ({ url: href, label }) => {
      return h('div', [
        h('a.plain-link', {
          href, target: '_blank'
        }, label )
      ]);
    }).slice( 0, limit );

    return (
      h('div.feature-item', [
        h('div.feature-item-title', title),
        h('div.feature-item-body-row', [
          h('div.feature-item-body.feature-item-sources', sourceComponents),
          h('div.feature-item-body', itemComponents)
        ])
      ])
    );
  }
}

// Specifies the default values for props:
FeatureItem.defaultProps = {
  title: null,
  items: [],
  sources: [],
  limit: Number.MAX_SAFE_INTEGER
};

class FeatureView extends React.Component {

  render(){

    const { feature } = this.props;
    if( feature == null ) return null;

    const { article, pathways, entities, authors } = feature;
    const pcPathway = _.find( pathways, ['db', NS_PATHWAYCOMMONS] );
    const biofactoidPathway = _.find( pathways, ['db', NS_BIOFACTOID] );

    const featureItems = [
      {
        title: 'Genes & Chemicals',
        items: entities,
        sources: [
          { label: 'NCBI', className: 'i.icon.icon-ncbi' },
          { label: 'ChEBI', className: 'i.icon.icon-chebi' }
        ]
      },
      {
        title: 'Authors',
        items: authors,
        sources: [
          { label: 'ORCID', className: 'i.icon.icon-orcid' }
        ]
      }
    ].map( i => h(FeatureItem, i) );

    return (
      h('div.feature-container', [
        h('div.feature-content.credit', [
          h('a', {
            href: FACTOID_URL,
            target: '_blank'
          }, [
            h('span.feature-detail', 'Ariticle data provided by biofactoid.org')
          ])
        ]),
        h('div.feature-content.article', [
          h('div.feature-item', [
            h('div.feature-item-body', [
              h('a.feature-headline', {
                href: article.url,
                target: '_blank'
              }, article.title),
              h('div.feature-detail', [
                h('span', article.authors),
                h('span', ' \u2022 '),
                h('span', article.reference)
              ])
            ])
          ]),
          h('hr')
        ]),
        h('div.feature-content.pathway', [
          h('div.feature-item', [
            h('div.feature-item-title', 'Pathway'),
            h('div.feature-item-body.feature-appcard', [
              h(AppCard, {
                url: biofactoidPathway.url,
                image: h('img', { src: biofactoidPathway.imageSrc }),
                title: h('div', [
                  h('i.icon.logo-biofactoid')
                ]),
                body: h('div', biofactoidPathway.text.map( ({title, body}) => {
                  return h( 'p', [
                    h('span.feature-appcard-body-title', title ),
                    h('span', ': ' ),
                    h('span', body )
                  ]);
                } ) )
              })
            ]),
            h('div.feature-item-body-row', [
              h('a.plain-link', {
                href: `/pathways?uri=${pcPathway.url}`,
                target: '_blank'
              }, 'Detailed pathway view (SBGN)')
            ])
          ]),

        ]),
        h('div.feature-content.metadata', featureItems )
      ])
    );
  }
}

module.exports = { FeatureView };