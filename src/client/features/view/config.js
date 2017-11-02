const databases = [
  ['BioGrid', 'https://thebiogrid.org/', ''],
  ['DrugBank', 'https://www.drugbank.ca/', ''],
  ['mirtarBase', 'http://mirtarbase.mbc.nctu.edu.tw/', 'php/detail.php?mirtid=MIRT000002'],
  ['NetPath', 'http://www.netpath.org/', 'molecule?molecule_id='],
  ['Panther', 'http://pantherdb.org/', 'genes/geneList.do?searchType=basic&fieldName=all&organism=all&listType=1&fieldValue='],
  ['PID', null],
  ['PhosphoSitePlus', null],
  ['Reactome', 'https://reactome.org/', 'content/detail/'],
  ['SMPD', null],
  ['Wikipathways', null],
  ['UniProt', 'http://www.uniprot.org/', 'uniprot/'],
  ['HGNC', 'https://www.genenames.org/', 'cgi-bin/search?search_type=all&search='],
  ['ChEBI', 'https://www.ebi.ac.uk/chebi/', 'searchId.do?chebiId='],
  ['Kegg Reaction', 'http://www.genome.jp/', 'dbget-bin/www_bget?rn:'],
  ['Kegg Compound', 'http://www.genome.jp/', 'dbget-bin/www_bget?cpd:'],
  ['Kegg Drug', 'http://www.genome.jp/', 'dbget-bin/www_bget?drg:'],
  ['KEGG', 'http://www.genome.jp/dbget-bin/www_bfind_sub?mode=bfind&max_hit=1000&dbkey=kegg&keywords=', ''],
  ['PubMed', 'https://www.ncbi.nlm.nih.gov/pubmed/', '?term='],
  ['Ensembl', 'https://www.ensembl.org/', 'Multi/Search/Results?q=']
];

module.exports = {
  databases
}