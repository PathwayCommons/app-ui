const React = require('react');
const h = require('react-hyperscript');
const { ServerAPI } = require('../../services');
// const _ = require('lodash');

// const { ServerAPI } = require('../../services');
// const { NS_CHEBI, NS_ENSEMBL, NS_HGNC, NS_HGNC_SYMBOL, NS_NCBI_GENE, NS_PUBMED, NS_REACTOME, NS_UNIPROT } = require('../../../config');

// const DEFAULT_NUM_NAMES = 3;
// const SUPPORTED_COLLECTIONS = new Map([
//   [NS_CHEBI, 'ChEBI'],
//   [NS_ENSEMBL, 'Ensembl'],
//   [NS_HGNC, 'HGNC'],
//   [NS_HGNC_SYMBOL, 'HGNC'],
//   [NS_NCBI_GENE, 'NCBI Gene'],
//   [NS_REACTOME, 'Reactome'],
//   [NS_UNIPROT, 'UniProt']
// ]);

// A component that displays a pathway title
// props:
// - pathway: Model instance
class PathwayTitle extends React.Component {
  constructor(props){
    super(props);
    const { pathway } = this.props;

    this.state = {
      name: pathway.name(),
      publications: []
    };
  }

  async loadPublications(){
    const MAX_PUBS = 10;
    const isPubmedXref = ({ db }) => db === 'pubmed';
    const { pathway } = this.props;
    const pubmedIds = pathway.publicationXrefs().slice( 0, MAX_PUBS ).filter( isPubmedXref ).map( ({ id }) => id );
    try {
      const publications = await ServerAPI.getPubmedPublications( pubmedIds );
      this.setState({ publications });
    } catch( err ){
      // Swallow error
    }
  }

  componentDidMount(){
    return this.loadPublications();
  }

  render(){
    const { pathway } = this.props;
    const { name, publications } = this.state;
    console.log( publications );

    return h('div.pathway-title', [
      h('div.pathway-title-name', name ),
      h('div.pathway-title-source', [ h('a.plain-link', { href: pathway.datasourceUrl(), target: '_blank' }, ' ' + pathway.datasource()) ])
    ]);
  }
}


module.exports = PathwayTitle;