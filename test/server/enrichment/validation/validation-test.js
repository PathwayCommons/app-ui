const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const { DATASOURCE_NAMES } = require('../../../../src/models/entity/summary.js');
const { getForm, mapDBNames, bodyHandler } = require('../../../../src/server/external-services/gprofiler/gconvert');
const InvalidParamError = require('../../../../src/server/errors/invalid-param');

const query1 = [
  'TP53',
  'P04637',
  'ENSG00000141510',
  '9518',
  'E2F1',
  'ATP'
];
const defaultOptions = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'HGNC',
  'prefix': 'ENTREZGENE_ACC'
};
const userOptions = {
  target: 'HGNC Symbol',
  organism: 'hsapiens'
};

const validResult1 = {
	"unrecognized": [
		"ATP"
	],
	"duplicate": {
		"TP53": [
			"TP53",
			"P04637",
			"ENSG00000141510"
		]
	},
	"alias": {
		"9518": "GDF15",
		"TP53": "TP53",
		"P04637": "TP53",
		"ENSG00000141510": "TP53",
		"E2F1": "E2F1"
	}
};

describe('Test validation - Enrichment Validation Service', function() {

  describe('Test mapDBNames()', function() {
    it('should map MIRIAM name for HGNC Symbol', function () {
      const result = mapDBNames( DATASOURCE_NAMES.HGNC_SYMBOL );
      expect( result ).to.equal( 'HGNC' );
    });

    it('should map MIRIAM name for HGNC Symbol', function () {
      const result = mapDBNames( DATASOURCE_NAMES.HGNC );
      expect( result ).to.equal( 'HGNC_ACC' );
    });

    it('should map MIRIAM name for UniProt', function () {
      const result = mapDBNames( DATASOURCE_NAMES.UNIPROT );
      expect( result ).to.equal( 'UNIPROTSWISSPROT' );
    });

    it('should map MIRIAM name for NCBI Gene', function () {
      const result = mapDBNames( DATASOURCE_NAMES.NCBI_GENE );
      expect( result ).to.equal( 'ENTREZGENE_ACC' );
    });

    it('should map MIRIAM name for Ensembl', function () {
      const result = mapDBNames( DATASOURCE_NAMES.ENSEMBL );
      expect( result ).to.equal( 'ENSG' );
    });

  });

  describe('Test getForm()', function() {
    it('should return a correct object with default options', function () {
      const query = query1;
      const mappedDbName = mapDBNames( defaultOptions.target );
      const result = getForm( query, defaultOptions, {} );

      expect( result.target ).to.equal( mappedDbName );
      expect( result.organism ).to.equal( defaultOptions.organism );
      expect( result.query ).to.equal( query.join(" ") );
    });

    it('should return a correct object with user options', function () {
      const query = query1;
      const mappedDbName = mapDBNames( userOptions.target );
      const result = getForm( query, defaultOptions, userOptions );

      expect( result.target ).to.equal( mappedDbName );
    });

    it('should throw error with invalid user options', function () {
      expect( getForm.bind(getForm, query1, defaultOptions, { target: 'bloat' } ) ).to.throw( InvalidParamError );
      expect( getForm.bind(getForm, {}, defaultOptions, {} ) ).to.throw( InvalidParamError );
      expect( getForm.bind(getForm, query1, defaultOptions, { organism: 'bloat' } ) ).to.throw( InvalidParamError );
    });
  });

  describe('Test bodyHandler()', function() {
    it('should return a correct object ', function () {
      const gConvertbodytxt = fs.readFileSync(path.resolve(__dirname, 'gConvert-body.txt'), 'utf-8');
      const result = bodyHandler( gConvertbodytxt );
      expect( result ).to.deep.equal( validResult1 );
    });
  });

});