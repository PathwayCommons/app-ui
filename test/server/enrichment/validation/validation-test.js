const chai = require('chai');
const expect = chai.expect;
const fs = require ('fs');
const path = require ('path');
const _ = require('lodash');

const { NS_HGNC, NS_HGNC_SYMBOL, NS_UNIPROT, NS_NCBI_GENE, NS_ENSEMBL } = require('../../../../src/config');
const { getForm, mapParams, gConvertResponseHandler, GPROFILER_NS_MAP } = require ('../../../../src/server/external-services/gprofiler/gconvert');
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
  'target': NS_HGNC,
  'prefix': 'ENTREZGENE_ACC'
};

const userOptions = {
  'target': NS_HGNC_SYMBOL
};

const validResult1 = {
	"unrecognized": [
		"ATP"
	],
	"duplicate": {
		"TP53": [
			"TP53",
			"P04637",
			"ENSG00000141510",
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

describe ('Enrichment service: validation', function () {

  describe ('Test mapParams ()', function () {
    const baseParams = {
      'query': query1,
      'target': NS_HGNC,
      'organism': 'hsapiens'
    };

    it ('should map query array to string', function () {
      const result = mapParams( baseParams );
      expect( result.query ).to.equal( query1.join(" ") );
    });

    it ('should map name for HGNC Symbol', function () {
      const params = _.assign( {}, baseParams, { 'target': NS_HGNC_SYMBOL } );
      const result = mapParams( params );
      expect( result.target ).to.equal( GPROFILER_NS_MAP.get(NS_HGNC_SYMBOL) );
    });

    it ('should map name for HGNC', function () {
      const params = _.assign( {}, baseParams, { 'target': NS_HGNC } );
      const result = mapParams( params );
      expect( result.target ).to.equal( GPROFILER_NS_MAP.get(NS_HGNC) );
    });

    it ('should map name for UniProt', function () {
      const params = _.assign( {}, baseParams, { 'target': NS_UNIPROT } );
      const result = mapParams( params );
      expect( result.target ).to.equal( GPROFILER_NS_MAP.get(NS_UNIPROT) );
    });

    it ('should map name for NCBI Gene', function () {
      const params = _.assign( {}, baseParams, { 'target': NS_NCBI_GENE } );
      const result = mapParams( params );
      expect( result.target ).to.equal( GPROFILER_NS_MAP.get(NS_NCBI_GENE) );
    });

    it ('should map name for Ensembl Gene', function () {
      const params = _.assign( {}, baseParams, { 'target': NS_ENSEMBL } );
      const result = mapParams( params );
      expect( result.target ).to.equal( GPROFILER_NS_MAP.get(NS_ENSEMBL) );
    });

  });

  describe ('Test getForm ()', function () {
    it ('should return to correct object with default options', function () {
      const result = getForm( query1, defaultOptions, {} );
      const expected = _.assign( {}, defaultOptions, {
        query: query1.join (" "),
        target: GPROFILER_NS_MAP.get(NS_HGNC)
      });
      expect( result ).to.deep.equal( expected );
    });

    it ('should return to correct object with user options', function () {
      const result = getForm( query1, defaultOptions, userOptions);
      const expected = _.assign( {}, defaultOptions, {
        query: query1.join (" "),
        target: GPROFILER_NS_MAP.get(NS_HGNC_SYMBOL)
      });
      expect( result ).to.deep.equal( expected );
    });

    it ('should throw error with invalid user options', function () {
      expect( getForm.bind( getForm, query1, defaultOptions, { target: 'bloat' } ) ).to.throw ( InvalidParamError );
      expect( getForm.bind( getForm, {}, defaultOptions, {} ) ).to.throw ( InvalidParamError );
    });
  });

  describe ('Test gConvertResponseHandler()', function () {
    it ('should return to a correct object', function () {
      const gConvertbodytxt = fs.readFileSync( path.resolve( __dirname, 'gconvert-body.txt' ), 'utf-8' );
      const result = gConvertResponseHandler( gConvertbodytxt );
      expect ( result ).to.deep.equal ( validResult1 );
    });
  });

});