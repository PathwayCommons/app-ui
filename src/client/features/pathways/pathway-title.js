const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { ServerAPI } = require('../../services');

const { DOI_BASE_URL, IDENTIFIERS_URL, PUBMED_BASE_URL } = require( '../../../config.js' );

// A component that displays a pathway title
// props:
// - pathway: Model instance
class PathwayTitle extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      publications: []
    };
  }

  /**
   * Supports PublicationXrefs from PubMed; in principle, could be any source (e.g. bioRxiv).
   * @returns {Promise<Array>} - Array of publication objects
   */
  async loadPublications(){
    const normalizePubmedRecord = record => {
      const { source: journal, date, firstAuthor, doi, pubmed  } = record;
      return { journal, date, firstAuthor, doi, pubmed };
    };
    const MAX_PUBS = 10;
    const isPubmedXref = ({ db }) => db === 'pubmed';
    const { pathway } = this.props;
    const pubmedIds = pathway.publicationXrefs().slice( 0, MAX_PUBS ).filter( isPubmedXref ).map( ({ id }) => id );
    try {
      return ServerAPI.getPubmedPublications( pubmedIds ).map( normalizePubmedRecord );
    } catch( err ){
      // Swallow error
    }
  }

  async componentDidMount(){
    const publications = await this.loadPublications();
    return new Promise(resolve => this.setState({ publications }, () => resolve( publications )));
  }

  // Enhance the name with a link to a source page if possible
  getName(){
    // Crapshoot whether a DB has a resolvable URL or not
    const DB_PREFIX_2_URL_TEMPLATE = new Map([
      ['biofactoid', `${IDENTIFIERS_URL}/biofactoid:`],
      ['panther.pathway', `${IDENTIFIERS_URL}/panther.pathway:`],
      ['smpdb', `${IDENTIFIERS_URL}/smpdb:`],
      ['reactome', `${IDENTIFIERS_URL}/reactome:`]
    ]);
    const isSupportedDb = ({ db }) => DB_PREFIX_2_URL_TEMPLATE.has( db );
    const { pathway } = this.props;
    let name = pathway.name();

    let uniXrefs = pathway.unificationXrefs();
    if( !_.isEmpty( uniXrefs ) ){
      uniXrefs = uniXrefs.filter( isSupportedDb );
      if( uniXrefs.length ){
        const { db, id } = _.first( uniXrefs );
        const baseUrl = DB_PREFIX_2_URL_TEMPLATE.get( db );
        const href = `${baseUrl}${id}`;
        name = [ h('a.highlight-link', { href, target: '_blank' }, name) ];
      }
    }

    return name;
  }

  // Add an article link when directly relevant to pathway (i.e. Biofactoid!)
  getSource(){
    const ARTICLE_SUPPORTED_DATASOURCES = new Set([ 'Biofactoid' ]);
    const { pathway } = this.props;
    const { publications } = this.state;
    const datasource = pathway.datasource();
    let source = [ h('a', { href: pathway.datasourceUrl(), target: '_blank' }, ' ' + datasource ) ];

    if( ARTICLE_SUPPORTED_DATASOURCES.has( datasource ) && publications.length ){
      const { journal, date, firstAuthor, doi, pubmed } = _.first( publications );
      const author = h('span', ` ${firstAuthor} et al.`);
      const reference = h( doi ? 'a.plain-link' : 'span', doi ? { href: `${DOI_BASE_URL}${doi}`, target: '_blank' } : null, `${journal} ${date}` );
      source.push( h('span', ' | '), author, ' ', reference );
      if( pubmed ){
        const pubmedLink = h('a.plain-link', { href: `${PUBMED_BASE_URL}${pubmed}`, target: '_blank' }, 'PubMed' );
        source.push( ' · ', pubmedLink );
      }
    }
    return source;
  }

  render(){
    let name = this.getName();
    let source = this.getSource();

    return h('div.pathway-title', [
      h('div.pathway-title-name', name ),
      h('div.pathway-title-source', source )
    ]);
  }
}


module.exports = PathwayTitle;