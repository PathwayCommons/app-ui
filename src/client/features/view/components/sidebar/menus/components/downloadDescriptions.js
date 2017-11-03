const h = require('react-hyperscript');

function DescPng() {
  return (
    h('span', 'Download an image of the entire view.')
  );
}

function DescGmt() {
  return (
    h('span', [
      'Database of named gene sets (UniProt) useful for performing enrichment analysis using ',
      h('a', {
        'target': '_blank',
        'href': 'http://software.broadinstitute.org/gsea/index.jsp'
      }, 'Gene Set Enrichment Analysis (GSEA)')
    ])
  );
}

function DescSif() {
  return (
    h('span', [
      h('a', {
        'target': '_blank',
        'href': 'http://wiki.cytoscape.org/Cytoscape_User_Manual/Network_Formats'
      }, 'Simple interaction format'),
      ' (SIF) is a list of interaction pairs useful for viewing, styling, and editing using ',
      h('a', {
        'target': '_blank',
        'href': 'http://cytoscape.org/'
      }, 'Cytoscape desktop software'),
      ', and for analysis with graph algorithms.'
    ])
  );
}

function DescTxt() {
  return (
    h('span', [
      'Similar to the ',
      h('a', {
        'target': '_blank',
        'href': 'http://wiki.cytoscape.org/Cytoscape_User_Manual/Network_Formats'
      }, 'SIF'),
      ' output, but contains extra information on interactions and a second table with information on nodes. Well-suited to a ',
      h('a', {
        'target': '_blank',
        'href': 'http://cytoscape.org/'
      }, 'Cytoscape - Attribute Table'),
      ' import.'
    ])
  );
}

function DescBiopax() {
  return (
    h('span', [
      h('a', {
        'target': '_blank',
        'href': 'http://www.biopax.org/'
      }, 'Biological Pathways Exchange (BioPax)'),
      ' format includes all details of the biological network stored in Pathway Commons. It is recommended that this format be interpreted using tools like ',
      h('a', {
        'target': '_blank',
        'href': 'http://biopax.github.io/Paxtools/'
      }, 'Paxtools'),
      ' or Jena SPARQL.'
    ])
  );
}

function DescJsonld() {
  return (
    h('span', [
      h('a', {
        'target': '_blank',
        'href': 'https://json-ld.org/'
      }, 'JSON-LD'),
      ' is a human-readable linked format. This format is ideal for programming environments, REST web services, and unstructured databses.'
    ])
  );
}

function DescSbgn() {
  return (
    h('span', [
      h('a', {
        'target': '_blank',
        'href': 'http://www.biopax.org/'
      }, 'Systems Biology Graphical Notation (SBGN)'),
      ' is a standard visual notation for biological networks. This download provides an XML in SBGN markup language (SBGN-ML).'
    ])
  );
}

module.exports = {
  png: DescPng,
  gmt: DescGmt,
  sif: DescSif,
  txt: DescTxt,
  biopax: DescBiopax,
  jsonld: DescJsonld,
  sbgn: DescSbgn
};