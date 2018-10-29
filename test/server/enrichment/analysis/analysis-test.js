const chai = require('chai');
const expect = chai.expect;
const fs = require ('fs');
const path = require ('path');
const { parseGProfilerResponse } = require('../../../../src/server/external-services/gprofiler');

const parsed1 = [
  "1	!	2.77e-02	18	60	10	0.167	0.556	GO:0006354	BP	1	   DNA-templated transcription, elongation	1	PAF1,ZMYND11,POLR2B,AFF4,SUPT16H,ELP4,GTF2H1,BRD4,SSRP1,SETD2",
  "1	!	2.77e-02	18	60	10	0.167	0.556	GO:0006368	BP	1	    transcription elongation from RNA polymerase II promoter	2	PAF1,ZMYND11,POLR2B,AFF4,SUPT16H,ELP4,GTF2H1,BRD4,SSRP1,SETD2"
];

describe ('Enrichment service: analysis', function () {

  describe ('Test mapParameters()', function () {
    it ('should map MIRIAM name for HGNC Symbol', function () {
      const result = mapDBNames (DATASOURCE_NAMES.HGNC_SYMBOL);
      expect(result).to.equal(GCONVERT_NAMES.HGNC_SYMBOL);
    });

    it ('should map MIRIAM name for HGNC Symbol', function () {
      const result = mapDBNames (DATASOURCE_NAMES.HGNC);
      expect(result).to.equal(GCONVERT_NAMES.HGNC);
    });

    it ('should map MIRIAM name for UniProt', function () {
      const result = mapDBNames (DATASOURCE_NAMES.UNIPROT);
      expect(result).to.equal(GCONVERT_NAMES.UNIPROT);
    });

    it ('should map MIRIAM name for NCBI Gene', function () {
      const result = mapDBNames (DATASOURCE_NAMES.NCBI_GENE);
      expect(result).to.equal(GCONVERT_NAMES.NCBI_GENE);
    });

  });

  describe ('Test getForm ()', function () {
    it ('should return to correct object with default options', function () {
      const query = query1;
      const mappedDbName = mapDBNames (defaultOptions.target);
      const result = getForm (query, defaultOptions, {});

      expect(result.target).to.equal(mappedDbName);
      expect(result.organism).to.equal(defaultOptions.organism);
      expect(result.query).to.equal(query.join (" "));
    });

    it ('should return to correct object with user options', function () {
      const query = query1;
      const mappedDbName = mapDBNames(userOptions.target);
      const result = getForm(query, defaultOptions, userOptions);

      expect (result.target).to.equal (mappedDbName);
    });

    it ('should throw error with invalid user options', function () {
      expect( getForm.bind( getForm, query1, defaultOptions, { target: 'bloat' } ) ).to.throw ( InvalidParamError );
      expect( getForm.bind( getForm, {}, defaultOptions, {} ) ).to.throw ( InvalidParamError );
      expect( getForm.bind( getForm, query1, defaultOptions, { organism: 'bloat' } ) ).to.throw ( InvalidParamError );
    });
  });

  describe ('Test bodyHandler ()', function () {
    it ('should return to a correct object', function () {
      const gConvertbodytxt = fs.readFileSync( path.resolve( __dirname, 'gConvert-body.txt' ), 'utf-8' );
      const result = bodyHandler( gConvertbodytxt );
      expect ( result ).to.deep.equal ( validResult1 );
    });
  });

});