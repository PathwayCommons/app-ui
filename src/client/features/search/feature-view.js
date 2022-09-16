const React = require('react');
const h = require('react-hyperscript');
const { AppCard } = require('../../common/components');
const _ = require('lodash');

const { NS_BIOFACTOID, NS_PATHWAYCOMMONS, FACTOID_URL } = require('../../../config');

const interleave = (arr, thing) => [].concat(...arr.map(n => [n, thing])).slice(0, -1);

class Logo extends React.Component {
  render(){
    const { className, label } = this.props;
    return h('div.logo', [
      h(`${className}.logo-icon`),
      h('div.logo-label', label)
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

    const itemComponents = items.map( ({ url: href, name }) => {
      return h('div', [
        h('a.plain-link', {
          href, target: '_blank'
        }, name )
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
    const biofactoidPathway = _.find( pathways, ['db', NS_BIOFACTOID] );
    // const pcPathway = _.find( pathways, ['db', NS_PATHWAYCOMMONS] );
    const caption = biofactoidPathway.caption || biofactoidPathway.text;

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
      // ,
      // {
      //   title: 'Detailed Pathway',
      //   items: [{
      //     url: `/pathways?uri=${pcPathway.url}`,
      //     name: pcPathway.name
      //   }],
      //   sources: [
      //     { label: 'Pathway Commons', className: 'i.icon.pc-logo-light' }
      //   ]
      // }
    ].map( i => h(FeatureItem, i) );

    return (
      h('div.feature-container', [
        h('div.feature-content.feature-article', [
          h('div.feature-item', [
            h('a.feature-headline', {
              href: article.url,
              target: '_blank'
            }, article.title),
            h('div.feature-detail', [
              h('span', article.authors),
              h('span', ' \u2022 '),
              h('span', article.reference)
            ])
          ]),
          h('hr'),
          h('div.feature-item', [
            h(AppCard, {
              url: biofactoidPathway.url,
              image: h('img', { src: biofactoidPathway.imageSrc }),
              title: h('div', [
                h('span', ' Explore on Biofactoid')
              ]),
              body: h('div', caption )
            })
          ])
        ]),
        h('div.feature-content.feature-metadata', interleave( featureItems, h('hr') ) ),
        h('div.feature-content.feature-credit', [
          h('a', {
            href: FACTOID_URL,
            target: '_blank'
          }, [
            h('span.feature-detail', 'Powered by biofactoid.org')
          ])
        ])
      ])
    );
  }
}

module.exports = { FeatureView };