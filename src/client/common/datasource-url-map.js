let datasourceURLMap = new Map();

datasourceURLMap.set('humancyc','https://humancyc.org'); // HumanCyc
datasourceURLMap.set('inoh','https://www.ncbi.nlm.nih.gov/pubmed/22120663'); //Integrating Network Objects with Hierarchies
datasourceURLMap.set('kegg','https://www.kegg.jp'); // KEGG Pathway
datasourceURLMap.set('pid','https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2686461/'); // NCI Pathway Interaction Database: Pathway
datasourceURLMap.set('netpath','http://www.netpath.org'); // NetPath
datasourceURLMap.set('panther','http://www.pantherdb.org'); // PANTHER Pathway
datasourceURLMap.set('reactome','https://reactome.org'); // Reactome
datasourceURLMap.set('smpdb','http://smpdb.ca'); // Small Molecule pathway Database
datasourceURLMap.set('wikipathways','https://www.wikipathways.org'); // WikiPathways

module.exports = datasourceURLMap;