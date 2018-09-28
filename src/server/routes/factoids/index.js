const express = require('express');
const Promise = require('bluebird');
const fetch = require('node-fetch');
const sbgn2CyJson = require('sbgnml-to-cytoscape');
const _ = require('lodash');
const { FACTOID_URL, BIOPAX_CONVERTERS_URL } = require('../../../config');

const router = express.Router();


let getFactoidBiopax = ( id ) => {
  return new Promise( ( resolve, reject ) => {
    fetch( FACTOID_URL + 'api/document/biopax/' + id, { method: 'get', accept: 'application/xml'})
    .then( res => res.text() )
    .then( resolve )
    .catch( reject );
  });
};

let biopax2Sbgn = biopax => {
  return new Promise(( resolve, reject ) => {
    fetch( BIOPAX_CONVERTERS_URL + 'factoid-converters/v1/biopax-to-sbgn', {
      method: 'post',
      body: biopax,
      headers: {
        'Content-Type': 'application/vnd.biopax.rdf+xml',
        'Accept': 'application/xml'
      },
    })
    .then( res => res.text() )
    .then( resolve )
    .catch( reject );
  });
};


let getFactoidDocJson = id => {
  return (
    getFactoidBiopax( id )
    .then( biopax => {
      return biopax2Sbgn( biopax );
    })
    .then( sbgn => {
      let cyjson = sbgn2CyJson( sbgn );

      return _.assign({}, cyjson, { pathwayMetadata: {} });
    })
  );
};


router.get('/', ( req, res ) => {
  let factoidDocId = req.query.id;


  getFactoidDocJson( factoidDocId ).then( factoidJson => res.json( factoidJson ) );
});

module.exports = router;