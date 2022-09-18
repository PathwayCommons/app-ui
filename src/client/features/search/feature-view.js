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

class Logo extends React.Component {
  render(){
    const { className, label } = this.props;
    return h('div.logo', [
      h(`${className}.logo-icon`),
      label ? h('div.logo-label', label) : null
    ]);
  }
}

class FeatureView extends React.Component {

  render(){

    const { feature } = this.props;
    if( feature == null ) return null;

    const { article, pathways, entities, authors } = feature;
    const pcPathway = _.find( pathways, ['db', NS_PATHWAYCOMMONS] );
    const biofactoidPathway = _.find( pathways, ['db', NS_BIOFACTOID] );

    const genes = entities.filter( ({ dbPrefix }) => dbPrefix === NS_NCBI_GENE );
    const orgs = _.groupBy( genes, g => g.organismName );
    const orgCounts = _.toPairs( orgs ).map( ([org, entries]) => [org, entries.length] );
    // eslint-disable-next-line no-unused-vars
    const maxOrgs = _.maxBy( orgCounts, ([org, count]) => count );
    const organism = maxOrgs && maxOrgs.length ? `Species: ${_.first( maxOrgs )}` : null;
    const chemicals = entities.filter( ({ dbPrefix }) => dbPrefix === NS_CHEBI.toUpperCase() );

    const genesComponent = genes.length ?
      h('div.feature-item-body', [
        h('div.feature-item-body-row', [
          h( Logo, { label: 'NCBI Gene', className: 'i.icon.icon-ncbi' }),
          h('ul.horizontal-list', genes.map( ({ url: href, label }, key) => {
            let element = h('a.plain-link', { href, target: '_blank' }, `${label} ` );
            return h('li', { key }, element );
          }))
        ])
      ]) : null;
    const chemicalsComponent = chemicals.length ?
      h('div.feature-item-body-row', [
        h( Logo, { label: 'ChEBI', className: 'i.icon.icon-chebi' }),
        h('ul.horizontal-list', chemicals.map( ({ url: href, label }, key) => {
          let element = h('a.plain-link', { href, target: '_blank' }, `${label} ` );
          return h('li', { key }, element );
        }))
      ]) : null;

    return (
      h('div.feature-container', [
        h('div.feature-area.article', [
          h('div.feature-item', [
            h('div.feature-item-body', [
              h('a.feature-headline', {
                href: article.url,
                target: '_blank'
              }, article.title),
              h('ul.horizontal-list.feature-detail', authors.map( ({ url: href, label }, key) => {
                let element = null;
                if( href ){
                  element = [
                    h('a.plain-link', { href, target: '_blank' }, `${label} ` ),
                    h('i.icon.icon-orcid.editor-info-author-orcid')
                  ];
                } else {
                  element = h( 'span', label );
                }
                return h('li', { key }, element );
              })),
              h('div.feature-detail', [
                h('span', article.reference)
              ])
            ])
          ]),
          h('hr')
        ]),
        h('div.feature-area.credit', [
          h('div.feature-item.feature-detail', [
            h('span', 'Article information curated by author using '),
            h('a.plain-link', {
              href: FACTOID_URL,
              target: '_blank'
            }, [
              h('span', 'biofactoid.org')
            ])
          ]),
          h('hr')
        ]),
        h('div.feature-area.pathway', [
          h('div.feature-item', [
            h('div.feature-item-title', 'Article Pathway'),
            h('div.feature-item-subtitle', organism),
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
        h('div.feature-area.metadata', [
          h('div.feature-item', [
            h('div.feature-item-title', 'Genes & Chemicals'),
            genesComponent,
            chemicalsComponent
          ])
        ])
      ])
    );
  }
}

module.exports = { FeatureView };