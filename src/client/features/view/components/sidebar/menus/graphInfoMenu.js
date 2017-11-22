const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const datasourceLinks = [
  ['BioGrid', 'http://identifiers.org/biogrid/', ''],
  ['DrugBank', 'https://www.drugbank.ca/', ''],
  ['mirtarBase', 'http://identifiers.org/mirtarbase/', ''],
  ['NetPath', 'http://www.netpath.org/', 'molecule?molecule_id='],
  ['PANTHER', 'http://pantherdb.org/', 'genes/geneList.do?searchType=basic&fieldName=all&organism=all&listType=1&fieldValue='],
  ['PID', null],
  ['PhosphoSitePlus', null],
  ['Reactome', 'http://identifiers.org/reactome/', ''],
  ['SMPD', null],
  ['Wikipathways', 'http://identifiers.org/wikipathways/' , ''],
  ['UniProt', '	http://identifiers.org/uniprot/', ''],
  ['HGNC Symbol', 'http://identifiers.org/hgnc.symbol/', ''],
  ['HGNC', 'http://identifiers.org/hgnc/', ''],
  ['ChEBI', 'http://identifiers.org/chebi/', ''],
  ['KEGG', 'http://identifiers.org/kegg/', ''],
  ['PubMed', 'http://identifiers.org/pubmed/', ''],
  ['Ensembl', 'http://identifiers.org/ensembl/', ''],
  ['Enzyme Nomenclature', 'http://identifiers.org/ec-code/', ''],
  ['PubChem-Substance', 'http://identifiers.org/pubchem.substance/', ''],
  ['3DMET', 'http://identifiers.org/3dmet/', ''],
  ['Chemical Component Dictionary', 'http://identifiers.org/pdb-ccd/', ''],
  ['CAS', 'http://identifiers.org/cas/', '']
];

class GraphInfoMenu extends React.Component {

  getDatasourceLink(datasource) {
    const link = datasourceLinks.filter(ds => ds[0].toUpperCase() === datasource.toUpperCase());

    return _.get(link, '0.1', '');
  }

  render() {
    const props = this.props;

    const datasourceLink = this.getDatasourceLink(props.datasource);

    const comments = props.comments.map(comment => {
      return h('div', [
        comment.replace(/<p>/g, ' '),
        h('br'),
        h('br')
      ]);
    });

    return (
      h('div', [
        h('h1', props.name),
        h('h4', [
          'Sourced from ',
          h('a', { href: datasourceLink, target: '_blank'}, props.datasource)
        ]),
        h('div', [
          h('h2', 'Additional Information')
        ].concat(comments))
      ])
    );
  }
}

module.exports = GraphInfoMenu;