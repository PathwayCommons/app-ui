let dsMap = {
  'Reactome': {
    'id': 'reactome',
    'uri': 'http://pathwaycommons.org/pc2/reactome',
    'homepage': 'https://reactome.org',
    'name': 'Reactome',
    'description': `Reactome v64 (only 'Homo_sapiens.owl') 26-Mar-2018`,
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/reactome.png',
    'hasPathways': true
  },
  'pid': {
    'id': 'pid',
    'uri': 'http://pathwaycommons.org/pc2/pid',
    'homepage': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2686461/',
    'name': 'NCI Pathway Interaction Database: Pathway',
    'description': 'NCI Curated Human Pathways from PID (final); 27-Jul-2015',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/nci_nature.png',
    'hasPathways': true
  },
  'PhosphoSite': {
    'id': 'psp',
    'uri': 'http://pathwaycommons.org/pc2/psp',
    'homepage': 'http://www.phosphosite.org/',
    'name': 'PhosphoSitePlus',
    'description': 'PhosphoSite Kinase-substrate information; 16-Mar-2018',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/psp.png',
    'hasPathways': false
  },
  'HumanCyc': {
    'id': 'humancyc',
    'uri': 'http://pathwaycommons.org/pc2/humancyc',
    'homepage': 'https://humancyc.org/',
    'name': 'HumanCyc',
    'description': 'HumanCyc 20; 2016; under license from SRI International, www.biocyc.org',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/humancyc.png',
    'hasPathways': true
  },
  'HPRD': {
    'id': 'hprd',
    'uri': 'http://pathwaycommons.org/pc2/hprd',
    'homepage': 'http://www.hprd.org/',
    'name': 'HPRD',
    'description': 'HPRD PSI-MI Release 9; 13-Apr-2010',
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/hprd.png',
    'hasPathways': false
  },
  'PANTHER': {
    'id': 'panther',
    'uri': 'http://pathwaycommons.org/pc2/panther',
    'homepage': 'http://www.pantherdb.org/',
    'name': 'PANTHER Pathway',
    'description': 'PANTHER Pathways 3.6.1 on 25-Jan-2018 (auto-converted to human-only model)',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/panther.png',
    'hasPathways': true
  },
  'DIP': {
    'id': 'dip',
    'uri': 'http://pathwaycommons.org/pc2/dip',
    'homepage': 'http://dip.doe-mbi.ucla.edu/',
    'name': 'Database of Interacting Proteins',
    'description': 'DIP (human), 05-02-2017',
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/dip_logo.png',
    'hasPathways': false
  },
  'BioGRID': {
    'id': 'biogrid',
    'uri': 'http://pathwaycommons.org/pc2/biogrid',
    'homepage': 'http://thebiogrid.org/',
    'name': 'BioGRID',
    'description': 'BioGRID Release 3.4.158 (human and the viruses), 25-Feb-2018',
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/favicon_bigger.png',
    'hasPathways': false
  },
  'IntAct': {
    'id': 'intact',
    'uri': 'http://pathwaycommons.org/pc2/intact',
    'homepage': 'http://www.ebi.ac.uk/intact/',
    'name': 'IntAct',
    'description': `IntAct (human only; 'negative' files removed), 21-Mar-2018`,
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/logo_intact_small.gif',
    'hasPathways': false
  },
  'BIND': {
    'id': 'bind',
    'uri': 'http://pathwaycommons.org/pc2/bind',
    'homepage': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC165503/',
    'name': 'BIND',
    'description': 'BIND (human), 15-Dec-2010',
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/bindinside_logo.jpg',
    'hasPathways': false
  },
  'CORUM': {
    'id': 'corum',
    'uri': 'http://pathwaycommons.org/pc2/corum',
    'homepage': 'http://mips.helmholtz-muenchen.de/genre/proj/corum/',
    'name': 'CORUM',
    'description': 'CORUM (human only), 17-Feb-2012',
    'type': 'PSI_MI',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/topright.jpg',
    'hasPathways': false
  },
  'MSigDB': {
    'id': 'msigdb',
    'uri': 'http://pathwaycommons.org/pc2/msigdb',
    'homepage': 'http://software.broadinstitute.org/gsea/msigdb/',
    'name': 'MSigDB',
    'description': 'MSigDB v5.2 (XML), only human C3 TFT motif gene sets, 09/2016; converted to BioPAX with http://github.com/PathwayCommons/msigdb-to-biopax;',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/msigdb.gif',
    'hasPathways': false
  },
  'miRTarBase': {
    'id': 'mirtarbase',
    'uri': 'http://pathwaycommons.org/pc2/mirtarbase',
    'homepage': 'http://mirtarbase.mbc.nctu.edu.tw/',
    'name': 'miRTarBase',
    'description': 'Human miRNA-target gene relationships from MiRTarBase; v7.0, 15-SEP-2017, converted to BioPAX in Apr-2018 with http://github.com/PathwayCommons/mirtarbase-to-biopax tool',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/mirtarbaselogo.png',
    'hasPathways': false
  },
  'DrugBank': {
    'id': 'drugbank',
    'uri': 'http://pathwaycommons.org/pc2/drugbank',
    'homepage': 'http://www.drugbank.ca/',
    'name': 'DrugBank',
    'description': 'DrugBank v5.0.11, 20-Dec-2017, converted to BioPAX with our http://github.com/PathwayCommons/drugbank-llto-biopax tool',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/drugbanklogo.png',
    'hasPathways': false
  },
  'Recon X': {
    'id': 'reconx',
    'uri': 'http://pathwaycommons.org/pc2/reconx',
    'homepage': 'http://humanmetabolism.org/',
    'name': 'Recon X',
    'description': 'Recon X: Reconstruction of the Human Genome; SBML model from BioModels, Recon 2 v2.02 (2013), converted to BioPAX by us using http://github.com/PathwayCommons/reconx-to-biopax library.',
    'type': 'SBML',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/reconxlogo.png',
    'hasPathways': false
  },
  'CTD': {
    'id': 'ctd',
    'uri': 'http://pathwaycommons.org/pc2/ctd',
    'homepage': 'http://ctdbase.org/',
    'name': 'Comparative Toxicogenomics Database',
    'description': 'Curated chemical–gene interactions from Comparative Toxicogenomics Database, MDI Biological Laboratory, and NC State University; 03-Apr-2018 release; converted to BioPAX with http://github.com/PathwayCommons/ctd-to-biopax tool;',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/ctdlogo.png',
    'hasPathways': false
  },
  'KEGG': {
    'id': 'kegg',
    'uri': 'http://pathwaycommons.org/pc2/kegg',
    'homepage': 'https://www.kegg.jp',
    'name': 'KEGG Pathway',
    'description': 'KEGG 07/2011 (only human, hsa* files), converted to BioPAX by BioModels (http://www.ebi.ac.uk/biomodels-main/) team',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/kegg128.gif',
    'hasPathways': true
  },
  'SMPDB': {
    'id': 'smpdb',
    'uri': 'http://pathwaycommons.org/pc2/smpdb',
    'homepage': 'http://smpdb.ca',
    'name': 'Small Molecule Pathway Database',
    'description': 'Small Molecule Pathway Database 2.0, 13-Apr-2018 (only human)',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/smpdb_icon.png',
    'hasPathways': true
  },
  'INOH': {
    'id': 'inoh',
    'uri': 'http://pathwaycommons.org/pc2/inoh',
    'homepage': 'https://www.ncbi.nlm.nih.gov/pubmed/22120663',
    'name': 'Integrating Network Objects with Hierarchies',
    'description': 'INOH 4.0 (signal transduction and metabolic data), 22-MAR-2011',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/inoh_logo.png',
    'hasPathways': true
  },
  'NetPath': {
    'id': 'netpath',
    'uri': 'http://pathwaycommons.org/pc2/netpath',
    'homepage': 'http://www.netpath.org',
    'name': 'NetPath',
    'description': 'NetPath 12/2011',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/netpath_logo.png',
    'hasPathways': true
  },
  'WikiPathways': {
    'id': 'wp',
    'uri': 'http://pathwaycommons.org/pc2/wp',
    'homepage': 'https://www.wikipathways.org',
    'name': 'WikiPathways',
    'description': 'WikiPathways - Community Curated Human Pathways; 29/09/2015 (human)',
    'type': 'BIOPAX',
    'iconUrl': 'http://pathwaycommons.github.io/cpath2/logos/wikipathways.png',
    'hasPathways': true
  },
  'InnateDB': {
    'id': 'innatedb',
    'uri': 'http://pathwaycommons.org/pc2/innatedb',
    'homepage': 'http://www.innatedb.ca/',
    'name': 'InnateDB',
    'description': 'InnateDB Curated Interactions (human), 2018-04-01',
    'type': 'PSI_MITAB',
    'iconUrl': 'http://www.innatedb.com/images/Innatedb-2010-large.png',
    'hasPathways': false
  }
};

module.exports = {
  findByUri( uri ){
    return Object.values(dsMap).find( ds => ds.uri === uri );
  },
  names(){
    return Object.keys(dsMap);
  },
  findByName( name ){
    return dsMap[ name ];
  }
};