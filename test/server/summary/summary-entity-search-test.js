// const chai = require('chai');
// const expect = chai.expect;
// const { entitySearch, entityFetch } = require('../../../src/server/routes/summary/entity');
// const config = require('../../../src/config');

// const NCBI_GENE_FETCH_URL = `${config.NCBI_EUTILS_BASE_URL}/esummary.fcgi?retmode=json&db=gene&id=`;
// const HGNC_SYMBOL_FETCH_URL = `${config.NCBI_EUTILS_BASE_URL}/esummary.fcgi?retmode=json&db=gene&id=`;
// const HGNC_SYMBOL_FETCH_URL = `${UNIPROT_API_BASE_URL}/proteins?offset=0&accession=${accessions.join(',')}`

// describe ('Summary Entity service', function () {
//   describe ('entityFetch', function () {

//     before(function() {
//       global.fetch = function(){
//         var args = Array.prototype.slice.call( arguments );
//         this.console.log( args );
//         return new Promise( resolve => {
//           resolve({
//             ok: true,
//             json: () => ({ "key": "value" })
//           });
//         });
//       };
//     });

//     it('Should be true', async () => {
//       const result =  await entityFetch( ['TP53'] );
//       expect( result ).not.to.be( null );
//     });
//   });
// });