const React = require('react');
const ReactDom = require('react-dom');
const hh = require('hyperscript');
const h = require('react-hyperscript');
const tippy = require('tippy.js');

const PathwayNodeMetadata = require('../../../models/pathway/pathway-node-metadata');

let DEFAULT_NUM_LINKS = 3;
let DEFAULT_NUM_NAMES = 3;

class PathwayNodeMetadataView extends React.Component {
  constructor(props){
    super(props);
  }

  render(){
    let { metadata } = this.props;

    if ( metadata.isEmpty() ) {
      return h('div.metadata-tooltip', [
        h('div.tooltip-heading', [
          h('a.tooltip-heading-link', {
            target: '_blank',
            href: '/search?q=' + metadata.searchLink(),
          }, metadata.label() || metadata.displayName()),
        ]),
        h('div.tooltip-internal', h('div.metadata-tooltip-warning', 'No Additional Information'))
      ]);
    }

    let isChemicalFormula = name => !name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-[\]()\\=#$]{6,})$/ig);

    let synonyms = metadata.synonyms().filter(isChemicalFormula).slice(0, DEFAULT_NUM_NAMES).join(', ');

    let publications = metadata.publications().map(publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.metadata-publication', [
        h('a', { href: 'http://identifiers.org/pubmed/' + id }, title),
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

    return h('div.metadata-tooltip', [
      h('div.metadata-tooltip-content', [
        h('div.metadata-tooltip-header', [
          h('h2',  `${metadata.label() || metadata.displayName() || 'Unknown Entity'}`),
          showType ? h('div.metadata-tooltip-type-chip', metadata.type()) : null,
        ]),
        showBody ? h('div.metadata-tooltip-body', [
          showStdName ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', 'Name'),
            h('div.metadata-field-value', metadata.standardName())
          ]) : null,
          showDispName ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', 'Display Name'),
            h('div.metadata-field-value', metadata.displayName())
          ]) : null,
          showSynonyms ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Synonyms',
              // h('i.material-icons', 'expand_more')
            ]),
            h('div.metadata-field-value', synonyms)
          ]) : null,
          showPubs ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Publications',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div', publications)
          ]) : null
        ]): null,
        h('div.metadata-tooltip-footer', [
          showLinks ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Links',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div.metadata-links', metadata.databaseLinks().slice(0, DEFAULT_NUM_LINKS).map(link => {
              return h('a.plain-link', { href: link.url}, link.name);
            }))
          ]) : null
        ]),
        h('div.metadata-search-call-to-action', [
          h('a.metadata-find-pathways', {
            target: '_blank',
            href: '/search?q=' + metadata.searchLink()
            },
            `FIND RELATED PATHWAYS`
          )
        ])
      ])
    ]);
  }
}

// This metadata tip is only for entities i.e. nodes
// TODO make an edge metadata tip for edges (for the interactions app)
class PathwayNodeMetadataTooltip {

  constructor(node) {
    this.node = node;
    this.metadata = new PathwayNodeMetadata(node);
    this.tooltip = null;
  }

  show() {
    let getContentDiv = component => {
      let div = hh('div');
      ReactDom.render( component, div );
      return div;
    };

    if( this.tooltip != null ){
      this.tooltip.destroy();
      this.tooltip = null;
    }

    // publication data needs to be fetched from pubmed before we can display the tooltip
    this.metadata.getPublicationData().then( () => {
      let refObject = this.node.popperRef();
      let tooltip = tippy(refObject, {
        html: getContentDiv( h(PathwayNodeMetadataView, { metadata: this.metadata, } )),
        theme: 'light',
        interactive: true,
        trigger: 'manual',
        hideOnClick: false,
        arrow: true,
        placement: 'bottom',
        distance: 10}
      ).tooltips[0];

      this.tooltip = tooltip;
      this.tooltip.show();
    });
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  } 
}

module.exports = PathwayNodeMetadataTooltip;