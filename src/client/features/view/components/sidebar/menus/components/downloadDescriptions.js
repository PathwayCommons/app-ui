const h = require('react-hyperscript');

function DescPng() {
  return h('span',
    'Download an image of the entire view.'
  );
}

function DescGmt() {
  return h('span',
    'Gene Matrix Transposed format. The gene database of named gene sets (UniProt) useful for performing enrichment analysis using Gene Set Enrichment Analysis (GSEA)'
  );
}

function DescSif() {
  return h('span',
    'Simple interaction format (SIF) is a list of interaction pairs useful for viewing, styling, and editing using Cytoscape desktop software, and for analysis with graph algorithms.'
  );
}

function DescTxt() {
  return h('span',
    'Similar to the SIF output, but contains extra information on entities and interactions. See the SIF section on the PC2 formats page for more details.'
  );
}

function DescBiopax() {
  return h('span',
    'Biological Pathways Exchange (BioPAX) format includes all details of the biological network stored in Pathway Commons. It is recommended that this format be interpreted using tools like Paxtools or Jena SPARQL.'
  );
}

function DescJsonld() {
  return h('span',
    'JSON-LD is a human-readable linked format. This format is ideal for programming environments, REST web services, and unstructured databses.'
  );
}

function DescSbgn() {
  return h('span',
    'Systems Biology Graphical Notation (SBGN) is a standard visual notation for biological networks. This download provides an XML in SBGN markup language (SBGN-ML).'
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