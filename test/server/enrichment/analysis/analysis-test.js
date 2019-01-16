const chai = require('chai');
const expect = chai.expect;
const fs = require ('fs');
const path = require ('path');
const { parseGProfilerResponse } = require('../../../../src/server/external-services/gprofiler/gprofiler');
const PARSED_GPROFILER = require('./parsed-gprofiler.json');

describe ('Enrichment service: analysis', function () {
  describe ('Test parseGProfilerResponse()', () => {
    it ('should return to a correct object', () => {
      const gGostbodytxt = fs.readFileSync( path.resolve( __dirname, 'ggost-body.txt' ), 'utf-8' );
      const result = parseGProfilerResponse( gGostbodytxt );
      expect ( result ).to.deep.equal ( PARSED_GPROFILER );
    });
  });
});