const chai = require('chai');
const expect = chai.expect;
const {validatorGconvert} = require('../../../../src/server/enrichment/validation');

describe('test validatorGconvert', function() {
  this.timeout(500000);
  it('valid gene, no parameters', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'],{})).then(
      //resolved
      res => {
      const result = {
        "unrecognized": [
          "ATP"
        ],
        "duplicate": {
          "HGNC:11998": [
            "TP53"
          ]
        },
        "geneInfo": [
          {
            "initialAlias": "TP53",
            "convertedAlias": "HGNC:11998"
          },
          {
            "initialAlias": "ATM",
            "convertedAlias": "HGNC:795"
          }
        ]
      };
      expect(res).to.deep.equal(result);
      },
      //rejected
      (rej) => {
      console.log("rejected");
      }
    );
  });

  it('valid targetDb and valid organism', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'], {target: "ensg", organism: "hsapiens" })).then(
      //resolved
      (res) => {
      const result = {
        "unrecognized": [
          "ATP"
        ],
        "duplicate": {
          "ENSG00000141510": [
            "TP53"
          ]
        },
        "geneInfo": [
          {
            "initialAlias": "TP53",
            "convertedAlias": "ENSG00000141510"
          },
          {
            "initialAlias": "ATM",
            "convertedAlias": "ENSG00000149311"
          }
        ]
      };
      expect(res).to.deep.equal(result);
      },
      //rejected
      (rej) => {
      console.log("rejected");
      }
    );
  });

  it('valid targetDb and INVALID organism', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'], {target: "ENSG", organism: "dog" })).then(
        //resolved
        (res) => {
        console.log("resolved");
        },
        //rejected
        (rej) => {
        expect(true);
        }
    );
  });

  it('INVALID targetDb and valid organism', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'], {target: "layman", organism: "hsapiens" })).then(
        //resolved
        (res) =>  {
        console.log("resolved");
        },
        //rejected
        (rej) => {
        expect(true);
        }
    );
  });

  it('INVALID targetDb and INVALID organism', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'], {target: "layman", organism: "dog" })).then(
       //resolved
       (res) =>  {
       console.log("resolved");
       },
       //rejected
       (rej) => {
       expect(true);
       }
    );
  });
});