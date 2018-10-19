const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { generateIdentifiersUrl } = require('../../common/external-service-data');
const { ServerAPI } = require('../../services');

const DEFAULT_NUM_NAMES = 3;
const SUPPORTED_DB_LINKS = {
  'Reactome': 'reactome',
  'UniProt': 'uniprot knowledgebase',
  'NCBI Gene': 'ncbi gene',
  'HGNC Symbol': 'hgnc symbol'
};

const PUBMED_DB_KEY = 'pubmed';


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
    let pubmedIds = _.get(metadata, `databaseIds.${PUBMED_DB_KEY}`, null);

    if( pubmedIds != null ){
      ServerAPI.getPubmedPublications(pubmedIds).then( publications => {
        this.setState({ publications });
      });
    }
  }

  render(){
    let { node } = this.props;
    let { publications } = this.state;
    let md = node.data('metadata');
    let { synonyms, type, standardName, displayName, databaseIds } = md;
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

    let dbLinks = [];
    Object.entries(SUPPORTED_DB_LINKS).forEach( entry =>{
      let [dbDisplayName, dbLookupId] = entry;

      if( !_.isEmpty(databaseIds[dbLookupId]) ){
        let id = _.get(databaseIds, `${dbLookupId}.0`);
        dbLinks.push(h('a.plain-link', { href: generateIdentifiersUrl( dbLookupId, id) }, dbDisplayName));
      }
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