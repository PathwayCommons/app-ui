const chai = require('chai');
const expect = chai.expect;
const { validatorGconvert } = require('../../../../src/server/external-services/gprofiler');

const validResult_default = {
	"unrecognized": [
		"ATP"
	],
	"duplicate": {
		"HGNC:11998": [
			"TP53"
		]
	},
	"alias": {
    "TP53": "HGNC:11998",
    "ATM": "HGNC:795"
  }
};

const validResult_ENSG = {
	"unrecognized": [
		"ATP"
	],
	"duplicate": {
		"ENSG00000141510": [
			"TP53"
		]
	},
	"alias": {
    "TP53": "ENSG00000141510",
    "ATM": "ENSG00000149311"
  }
};

describe('Test validatorGconvert - Enrichment Validation Service', function() {

  it('should return correct results when no additional options are supplied', async () => {
    const result = await validatorGconvert(["TP53", "ATP", "ATM", "TP53"], {});
    expect( result ).to.deep.equal( validResult_default );
  });

  it('should return correct results when options are specified', async () => {
    const result = await validatorGconvert(["TP53", "ATP", "ATM", "TP53"], {target: "ENSG", organism: "hsapiens" });
    expect( result ).to.deep.equal( validResult_ENSG );
  });

  it('should reject when invalid organism is specified', async () => {
    try {
      await validatorGconvert(["TP53", "ATP", "ATM", "TP53"], { organism: "human" });
    } catch( err ) {
      expect( err.message ).to.equal( "Invalid organism" );
    }
  });

  it('should reject when invalid target is specified', async () => {
    try {
      await validatorGconvert(["TP53", "ATP", "ATM", "TP53"], { target: "nonexistantdatabase" });
    } catch( err ) {
      expect( err.message ).to.equal( "Invalid target" );
    }
  });

  it('should reject when invalid options are specified', async () => {
    try {
      await validatorGconvert(["TP53", "ATP", "ATM", "TP53"], { target: "nonexistantdatabase", organism: "human" });
    } catch( err ) {
      expect( err ).to.be.instanceOf( Error );
    }
  });

});