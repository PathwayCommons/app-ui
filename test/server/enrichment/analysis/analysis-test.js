const chai = require('chai');
const expect = chai.expect;
const fs = require ('fs');
const path = require ('path');
const { parseGProfilerResponse } = require('../../../../src/server/external-services/gprofiler/gprofiler');
const PARSED_GPROFILER = require('./parsed-gprofiler.json');

describe ('Enrichment service: analysis', function () {
  describe ('Test parseGProfilerResponse()', () => {
    it ('should return to a correct object', () => {
      const gGostbodyJSON = require('./ggost-body.json');
      const result = parseGProfilerResponse( gGostbodyJSON, {} );
      expect ( result ).to.deep.equal ( PARSED_GPROFILER );
    });
  });
});