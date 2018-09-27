const React = require('react');
const h = require('react-hyperscript');

let DEFAULT_NUM_LINKS = 3;
let DEFAULT_NUM_NAMES = 3;

// A component that displays a pathway node's metadata
// props:
// - metadata (Cytoscape node)
class PathwayNodeMetadataView extends React.Component {
  constructor(props){
    super(props);
  }

  render(){
    let { metadata } = this.props;

    if ( metadata.isEmpty() ) {
      return h('div.cy-tooltip', [
        h('div.cy-tooltip-content', [
          h('div.cy-tooltip-header', [
            h('h2.cy-tooltip-title',  `${metadata.sbgnClass()}`)
          ])
        ])
      ]);
    }

    let isChemicalFormula = name => !name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-[\]()\\=#$]{6,})$/ig);

    let synonyms = metadata.synonyms().filter(isChemicalFormula).slice(0, DEFAULT_NUM_NAMES).join(', ');

    let publications = metadata.publications().map(publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.cy-overflow-content', [
        h('a.plain-link', { href: 'http://identifiers.org/pubmed/' + id, target: '_blank' }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let showType = metadata.type() !== '';

    let showStdName = metadata.standardName() !== '';
    let showDispName = metadata.displayName() !== '' && metadata.displayName() !== metadata.label();
    let showSynonyms = synonyms.length > 0;
    let showPubs = publications.length > 0;

    let showBody = showStdName || showDispName || showSynonyms || showPubs;
    let showLinks = metadata.databaseLinks().length > 0;
    let showPcSearchLink = metadata.label() || metadata.displayName();

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-content', [
        h('div.cy-tooltip-header', [
          h('h2.cy-tooltip-title',  `${metadata.label() || metadata.displayName() || ''}`),
          showType ? h('div.cy-tooltip-type-chip', metadata.type()) : null,
        ]),
        showBody ? h('div.cy-tooltip-body', [
          showStdName ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', 'Name'),
            h('div.cy-tooltip-field-value', metadata.standardName())
          ]) : null,
          showDispName ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', 'Display Name'),
            h('div.cy-tooltip-field-value', metadata.displayName())
          ]) : null,
          showSynonyms ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Synonyms',
              // h('i.material-icons', 'expand_more')
            ]),
            h('div.cy-tooltip-field-value', synonyms)
          ]) : null,
          showPubs ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Publications',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div', publications)
          ]) : null
        ]): null,
        h('div.cy-tooltip-footer', [
          showLinks ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Links',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div.cy-tooltip-links', metadata.databaseLinks().slice(0, DEFAULT_NUM_LINKS).map(link => {
              return h('a.plain-link', { href: link.url, target: '_blank'}, link.name);
            }))
          ]) : null
        ]),
        showPcSearchLink ? h('div.cy-tooltip-call-to-action', [
          h('a', {
            target: '_blank',
            href: '/search?q=' + metadata.searchLink()
            }, [
              h('button.call-to-action', 'Find Related Pathways')
            ]
          )
        ]) : null
      ])
    ]);
  }
}


module.exports = PathwayNodeMetadataView;