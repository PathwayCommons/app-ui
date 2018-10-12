const chai = require('chai');
const expect = chai.expect;
const { entitySearch } = require('../../../src/server/routes/summary/entity');

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