const chai = require('chai');
const expect = chai.expect;
const { entitySearch, entityFetch } = require('../../../src/server/routes/summary/entity');
const dataSources = {
  NCBIGENE: 'http://identifiers.org/ncbigene/',
  HGNC: 'http://identifiers.org/hgnc/',
  UNIPROT: 'http://identifiers.org/uniprot/'
};
const validResult = {
	"4193": {
		"dataSource": "http://identifiers.org/ncbigene/",
		"displayName": "MDM2 proto-oncogene",
		"localID": "4193",
		"description": "This gene encodes a nuclear-localized E3 ubiquitin ligase. The encoded protein can promote tumor formation by targeting tumor suppressor proteins, such as p53, for proteasomal degradation. This gene is itself transcriptionally-regulated by p53. Overexpression or amplification of this locus is detected in a variety of different cancers. There is a pseudogene for this gene on chromosome 2. Alternative splicing results in a multitude of transcript variants, many of which may be expressed only in tumor cells. [provided by RefSeq, Jun 2013]",
		"aliasName": [
			"E3 ubiquitin-protein ligase Mdm2",
			"MDM2 oncogene, E3 ubiquitin protein ligase",
			"MDM2 proto-oncogene, E3 ubiquitin protein ligase",
			"Mdm2, p53 E3 ubiquitin protein ligase homolog",
			"Mdm2, transformed 3T3 cell double minute 2, p53 binding protein",
			"double minute 2, human homolog of; p53-binding protein",
			"oncoprotein Mdm2"
		],
		"aliasId": [
			"ACTFS",
			" HDMX",
			" hdm2"
		],
		"xref": {
			"http://identifiers.org/hgnc.symbol/": "MDM2",
			"http://identifiers.org/genecards/": "MDM2",
			"http://identifiers.org/uniprot/": "Q00987"
		}
	},
	"7157": {
		"dataSource": "http://identifiers.org/ncbigene/",
		"displayName": "tumor protein p53",
		"localID": "7157",
		"description": "This gene encodes a tumor suppressor protein containing transcriptional activation, DNA binding, and oligomerization domains. The encoded protein responds to diverse cellular stresses to regulate expression of target genes, thereby inducing cell cycle arrest, apoptosis, senescence, DNA repair, or changes in metabolism. Mutations in this gene are associated with a variety of human cancers, including hereditary cancers such as Li-Fraumeni syndrome. Alternative splicing of this gene and the use of alternate promoters result in multiple transcript variants and isoforms. Additional isoforms have also been shown to result from the use of alternate translation initiation codons from identical transcript variants (PMIDs: 12032546, 20937277). [provided by RefSeq, Dec 2016]",
		"aliasName": [
			"cellular tumor antigen p53",
			"antigen NY-CO-13",
			"mutant tumor protein 53",
			"p53 tumor suppressor",
			"phosphoprotein p53",
			"transformation-related protein 53",
			"tumor protein 53",
			"tumor supressor p53"
		],
		"aliasId": [
			"BCC7",
			" LFS1",
			" P53",
			" TRP53"
		],
		"xref": {
			"http://identifiers.org/hgnc.symbol/": "TP53",
			"http://identifiers.org/genecards/": "TP53",
			"http://identifiers.org/uniprot/": "P04637"
		}
	}
};

const validResult_NCBIGENE = {
	"4193": {
		"dataSource": "http://identifiers.org/ncbigene/",
		"displayName": "MDM2 proto-oncogene",
		"localID": "4193",
		"description": "This gene encodes a nuclear-localized E3 ubiquitin ligase. The encoded protein can promote tumor formation by targeting tumor suppressor proteins, such as p53, for proteasomal degradation. This gene is itself transcriptionally-regulated by p53. Overexpression or amplification of this locus is detected in a variety of different cancers. There is a pseudogene for this gene on chromosome 2. Alternative splicing results in a multitude of transcript variants, many of which may be expressed only in tumor cells. [provided by RefSeq, Jun 2013]",
		"aliasName": [
			"E3 ubiquitin-protein ligase Mdm2",
			"MDM2 oncogene, E3 ubiquitin protein ligase",
			"MDM2 proto-oncogene, E3 ubiquitin protein ligase",
			"Mdm2, p53 E3 ubiquitin protein ligase homolog",
			"Mdm2, transformed 3T3 cell double minute 2, p53 binding protein",
			"double minute 2, human homolog of; p53-binding protein",
			"oncoprotein Mdm2"
		],
		"aliasId": [
			"ACTFS",
			" HDMX",
			" hdm2"
		],
		"xref": {
			"http://identifiers.org/hgnc.symbol/": "MDM2",
			"http://identifiers.org/genecards/": "MDM2"
		}
	},
	"7157": {
		"dataSource": "http://identifiers.org/ncbigene/",
		"displayName": "tumor protein p53",
		"localID": "7157",
		"description": "This gene encodes a tumor suppressor protein containing transcriptional activation, DNA binding, and oligomerization domains. The encoded protein responds to diverse cellular stresses to regulate expression of target genes, thereby inducing cell cycle arrest, apoptosis, senescence, DNA repair, or changes in metabolism. Mutations in this gene are associated with a variety of human cancers, including hereditary cancers such as Li-Fraumeni syndrome. Alternative splicing of this gene and the use of alternate promoters result in multiple transcript variants and isoforms. Additional isoforms have also been shown to result from the use of alternate translation initiation codons from identical transcript variants (PMIDs: 12032546, 20937277). [provided by RefSeq, Dec 2016]",
		"aliasName": [
			"cellular tumor antigen p53",
			"antigen NY-CO-13",
			"mutant tumor protein 53",
			"p53 tumor suppressor",
			"phosphoprotein p53",
			"transformation-related protein 53",
			"tumor protein 53",
			"tumor supressor p53"
		],
		"aliasId": [
			"BCC7",
			" LFS1",
			" P53",
			" TRP53"
		],
		"xref": {
			"http://identifiers.org/hgnc.symbol/": "TP53",
			"http://identifiers.org/genecards/": "TP53"
		}
	}
};


const validResult_HGNC = {
	"TP53":{
		"dataSource":"http://identifiers.org/hgnc.symbol/",
		"displayName":"tumor protein p53",
		"localID":"TP53",
		"description":"",
		"aliasName":[
			"Li-Fraumeni syndrome"
		],
		"aliasId":[
			"p53",
			"LFS1"
		],
		"xref":{
			"http://identifiers.org/genecards/":"TP53",
			"http://identifiers.org/ncbigene/":"7157",
			"http://identifiers.org/uniprot/":"P04637"
		}
	},
	"MDM2":{
		"dataSource":"http://identifiers.org/hgnc.symbol/",
		"displayName":"MDM2 proto-oncogene",
		"localID":"MDM2",
		"description":"",
		"aliasName":[
		],
		"aliasId":[
			"HDM2",
			"MGC5370"
		],
		"xref":{
			"http://identifiers.org/genecards/":"MDM2",
			"http://identifiers.org/ncbigene/":"4193",
			"http://identifiers.org/uniprot/":"Q00987"
		}
	}
};

const validResult_UNIPROT = {
	"P04637":{
		"dataSource":"http://identifiers.org/uniprot/",
		"displayName":"Cellular tumor antigen p53",
		"localID":"P04637",
		"description":"Acts as a tumor suppressor in many tumor types; induces growth arrest or apoptosis depending on the physiological circumstances and cell type. Involved in cell cycle regulation as a trans-activator that acts to negatively regulate cell division by controlling a set of genes required for this process. One of the activated genes is an inhibitor of cyclin-dependent kinases. Apoptosis induction seems to be mediated either by stimulation of BAX and FAS antigen expression, or by repression of Bcl-2 expression. In cooperation with mitochondrial PPIF is involved in activating oxidative stress-induced necrosis; the function is largely independent of transcription. Induces the transcription of long intergenic non-coding RNA p21 (lincRNA-p21) and lincRNA-Mkln1. LincRNA-p21 participates in TP53-dependent transcriptional repression leading to apoptosis and seems to have an effect on cell-cycle regulation. Implicated in Notch signaling cross-over. Prevents CDK7 kinase activity when associated to CAK complex in response to DNA damage, thus stopping cell cycle progression. Isoform 2 enhances the transactivation activity of isoform 1 from some but not all TP53-inducible promoters. Isoform 4 suppresses transactivation activity and impairs growth suppression mediated by isoform 1. Isoform 7 inhibits isoform 1-mediated apoptosis. Regulates the circadian clock by repressing CLOCK-ARNTL/BMAL1-mediated transcriptional activation of PER2 (PubMed:24051492)",
		"aliasName":[
			"Antigen NY-CO-13",
			"Phosphoprotein p53",
			"Tumor suppressor p53"
		],
		"aliasId":[

		],
		"xref":{
			"http://identifiers.org/ncbigene/":"7157",
			"http://identifiers.org/hgnc.symbol/":"TP53",
			"http://identifiers.org/genecards/":"TP53"
		}
	},
	"Q00987":{
		"dataSource":"http://identifiers.org/uniprot/",
		"displayName":"E3 ubiquitin-protein ligase Mdm2",
		"localID":"Q00987",
		"description":"E3 ubiquitin-protein ligase that mediates ubiquitination of p53/TP53, leading to its degradation by the proteasome. Inhibits p53/TP53- and p73/TP73-mediated cell cycle arrest and apoptosis by binding its transcriptional activation domain. Also acts as a ubiquitin ligase E3 toward itself and ARRB1. Permits the nuclear export of p53/TP53. Promotes proteasome-dependent ubiquitin-independent degradation of retinoblastoma RB1 protein. Inhibits DAXX-mediated apoptosis by inducing its ubiquitination and degradation. Component of the TRIM28/KAP1-MDM2-p53/TP53 complex involved in stabilizing p53/TP53. Also component of the TRIM28/KAP1-ERBB4-MDM2 complex which links growth factor and DNA damage response pathways. Mediates ubiquitination and subsequent proteasome degradation of DYRK2 in nucleus. Ubiquitinates IGF1R and SNAI1 and promotes them to proteasomal degradation (PubMed:12821780, PubMed:15053880, PubMed:15195100, PubMed:15632057, PubMed:16337594, PubMed:17290220, PubMed:19098711, PubMed:19219073, PubMed:19837670, PubMed:19965871, PubMed:20173098, PubMed:20385133, PubMed:20858735, PubMed:22128911). Ubiquitinates DCX, leading to DCX degradation and reduction of the dendritic spine density of olfactory bulb granule cells (By similarity). Ubiquitinates DLG4, leading to proteasomal degradation of DLG4 which is required for AMPA receptor endocytosis",
		"aliasName":[
			"Double minute 2 protein",
			"Oncoprotein Mdm2",
			"RING-type E3 ubiquitin transferase Mdm2",
			"p53-binding protein Mdm2"
		],
		"aliasId":[

		],
		"xref":{
			"http://identifiers.org/ncbigene/":"4193",
			"http://identifiers.org/hgnc.symbol/":"MDM2",
			"http://identifiers.org/genecards/":"MDM2"
		}
	}
};

describe('Test of summary entitySearch function', function() {
  this.timeout( 10000 );

  it('should return correct summary for two valid HGNC symbols', async () => {
    const result = await entitySearch(['TP53', 'MDM2']);
    expect( result ).to.deep.equal( validResult );
  });

  it('should return empty summary for tokens not known to be IDs', async () => {
    const result = await entitySearch(['foo', 'bar']);
    expect( result ).to.be.an('object').that.is.empty;
  });

});

describe('Test of summary entityFetch function', function() {
  this.timeout( 10000 );

  it('should return correct summary for two valid NCBI Gene IDs', async () => {
    const result = await entityFetch(['7157', '4193'], dataSources.NCBIGENE );
    expect( result ).to.deep.equal( validResult_NCBIGENE );
	});

	it('should return correct summary for two valid HGNC symbols', async () => {
    const result = await entityFetch(['TP53', 'MDM2'], dataSources.HGNC );
    expect( result ).to.deep.equal( validResult_HGNC );
	});

	it('should return correct summary for two valid UniProt accessions', async () => {
    const result = await entityFetch(['P04637', 'Q00987'], dataSources.UNIPROT );
    expect( result ).to.deep.equal( validResult_UNIPROT );
  });

});
