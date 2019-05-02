const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { ServerAPI } = require('../../services');
const { NS_CHEBI, NS_ENSEMBL, NS_HGNC, NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_PUBMED, NS_REACTOME, NS_UNIPROT } = require('../../../config');

const DEFAULT_NUM_NAMES = 3;
const SUPPORTED_COLLECTIONS = new Map([
  [NS_CHEBI, 'ChEBI'],
  [NS_ENSEMBL, 'Ensembl'],
  [NS_HGNC, 'HGNC'],
  [NS_HGNC_SYMBOL, 'HGNC'],
  [NS_NCBI_GENE, 'NCBI Gene'],
  [NS_REACTOME, 'Reactome'],
  [NS_UNIPROT, 'UniProt']
]);

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
    let pubmedUris = _.get(metadata, `xrefLinks.${NS_PUBMED}`, null);

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
    const nodeData = node.data();
    const nodeClass = _.get( nodeData, ['class'] );
    const nodeLabel = _.get( nodeData, ['label'] );

    const defaultNodeMeta = {
      synonyms: [],
      datasource:'',
      type: nodeClass,
      standardName: '',
      displayName: nodeLabel,
      xrefLinks: []    
    }; 
    const nodeMeta = _.get( nodeData, ['metadata'], {} );
    const md = _.assign( {}, defaultNodeMeta, nodeMeta );
    
    let { synonyms, type, standardName, displayName, xrefLinks } = md;
    let title = nodeLabel || displayName; 
    let searchLinkQuery = displayName;
  
    let dbLinks = _.keys( xrefLinks ).map( collection => {
      let link = null;
      const displayName = SUPPORTED_COLLECTIONS.get( collection );
      const uri = _.get( xrefLinks, `${collection}[0]` );
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

    let showTitle = title !== '';
    let showType = type !== '';
    let showStdName = standardName !== '';
    let showDispName = displayName !== '' && displayName !== ( nodeLabel || title );
    let showSynonyms = synonyms.length > 0;
    let showPubs = publicationEles.length > 0;
    let showLinks = dbLinks.length > 0;
    
    let showHeader = showTitle || showType;
    let showBody = showStdName || showDispName || showSynonyms || showPubs;
    let showFooter = showLinks;
    let showPcSearchLink = searchLinkQuery !== '';
    
    return h('div.cy-tooltip', [
      h('div.cy-tooltip-content', [
        showHeader ? h('div.cy-tooltip-header', [
          showTitle? h('h2.cy-tooltip-title',  title): null,
          showType ? h('div.cy-tooltip-type-chip', type) : null,
        ]): null,
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
            ]),
            h('div.cy-tooltip-field-value', synonyms.slice(0, DEFAULT_NUM_NAMES).join(', '))
          ]) : null,
          showPubs ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Publications',
            ]),
            h('div', publicationEles)
          ]) : null
        ]): null,
        showFooter ? h('div.cy-tooltip-footer', [
          showLinks ? h('div.cy-tooltip-section', [
            h('div.cy-tooltip-field-name', [
              'Links',
            ]),
            h('div.cy-tooltip-links', dbLinks)
          ]) : null
        ]): null,
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