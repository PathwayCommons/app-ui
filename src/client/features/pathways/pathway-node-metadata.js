const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { ServerAPI } = require('../../services');

const DEFAULT_NUM_NAMES = 3;
// TODO - collection names (keys) should be accessed from config https://github.com/PathwayCommons/app-ui/issues/1131
const SUPPORTED_COLLECTIONS = new Map([
  ['Reactome'.toLowerCase(), 'Reactome'],
  ['UniProt Knowledgebase'.toLowerCase(), 'UniProt'],
  ['NCBI Gene'.toLowerCase(), 'NCBI'],
  ['HGNC Symbol'.toLowerCase(), 'HGNC'],
  ['ChEBI'.toLowerCase(), 'ChEBI'],
  ['Ensembl'.toLowerCase(), 'Ensembl']
]);
const PUBMED_DB_KEY = 'pubmed';

const getUriIds = uris => uris.map( uri => _.last( uri.split( '/' ) ) );

// A component that displays a pathway node's metadata
// props:
// - cytoscape node)
class PathwayNodeMetadataView extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      publications: []
    };
  }

  componentDidMount(){
    let { node } = this.props;
    let metadata = node.data('metadata');
    let pubmedUris = _.get(metadata, `xrefLinks.${PUBMED_DB_KEY}`, null);

    if( pubmedUris != null ){
      const pubmedIds = getUriIds( pubmedUris );
      ServerAPI.getPubmedPublications(pubmedIds).then( publications => {
        this.setState({ publications });
      });
    }
  }

  render(){
    let { node } = this.props;
    let { publications } = this.state;
    let md = node.data('metadata');
    let { synonyms, type, standardName, displayName, xrefLinks } = md;
    let searchLinkQuery = node.data('class') === 'process' ? displayName : node.data('label');
    let label = node.data('label');

    if( _.isEmpty( md ) ){
      return h('div.cy-tooltip', [
        h('div.cy-tooltip-content', [
          h('div.cy-tooltip-header', [
            h('h2.cy-tooltip-title',  node.data('class'))
          ])
        ])
      ]);
    }

    let dbLinks = _.keys( xrefLinks ).map( db => {
      let link = null;
      const displayName = SUPPORTED_COLLECTIONS.get( db.toLowerCase() );
      const uri = _.get( xrefLinks, `${db}[0]` );
      if ( displayName && uri ) link = h('a.plain-link', { href: uri, target: '_blank' }, displayName );
      return link;
    });

    let publicationEles = publications.map(publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.cy-overflow-content', [
        h('a.plain-link', { href: 'http://identifiers.org/pubmed/' + id, target: '_blank'  }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let showType = type !== '';

    let showStdName = standardName !== '';
    let showDispName = displayName !== '' && displayName !== label;
    let showSynonyms = synonyms.length > 0;
    let showPubs = publicationEles.length > 0;

    let showBody = showStdName || showDispName || showSynonyms || showPubs;
    let showLinks = dbLinks.length > 0;
    let showPcSearchLink = label || displayName;

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-content', [
        h('div.cy-tooltip-header', [
          h('h2.cy-tooltip-title',  `${label || displayName || ''}`),
          showType ? h('div.cy-tooltip-type-chip', type) : null,
        ]),
        showBody ? h('div.cy-tooltip-body', [
          showStdName ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', 'Name'),
            h('div.cy-tooltip-field-value', standardName)
          ]) : null,
          showDispName ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', 'Display Name'),
            h('div.cy-tooltip-field-value', displayName)
          ]) : null,
          showSynonyms ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Synonyms',
              // h('i.material-icons', 'expand_more')
            ]),
            h('div.cy-tooltip-field-value', synonyms.slice(0, DEFAULT_NUM_NAMES).join(', '))
          ]) : null,
          showPubs ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Publications',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div', publicationEles)
          ]) : null
        ]): null,
        h('div.cy-tooltip-footer', [
          showLinks ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Links',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div.cy-tooltip-links', dbLinks)
          ]) : null
        ]),
        showPcSearchLink ? h('div.cy-tooltip-call-to-action', [
          h('a', {
            target: '_blank',
            href: '/search?q=' + searchLinkQuery
          }, [
            h('button.call-to-action', 'Find Related Pathways')
          ])
        ]) : null
      ])
    ]);
  }
}


module.exports = PathwayNodeMetadataView;