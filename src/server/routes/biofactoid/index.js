const express = require('express');
const Promise = require('bluebird');
const { fetch } = require('../../../util');
const sbgn2CyJson = require('sbgnml-to-cytoscape');
const _ = require('lodash');
const { FACTOID_URL } = require('../../../config');

const router = express.Router();

let getDocs = () => {
  return fetch( FACTOID_URL + 'api/document/', { method: 'get', accept: 'application/json' })
  .then( res => res.json() );
};

let getDoc = id => {
  return fetch( FACTOID_URL + 'api/document/' + id, { method: 'get', accept: 'application/xml' })
  .then( res => res.json() );
};

let getDocSbgn = ( id ) => {
  return new Promise( ( resolve, reject ) => {
    fetch( FACTOID_URL + 'api/document/sbgn/' + id, { method: 'get', accept: 'application/xml'})
      .then( res => res.text() )
      .then( resolve )
      .catch( reject );
  });
};

let getDocSbgnJson = id => {
  return (
    getDocSbgn( id )
    .then( sbgn => {
      let cyjson = sbgn2CyJson( sbgn );

      return _.assign({}, cyjson, { pathwayMetadata: {} });
    })
  );
};

const getPathwayMetadata = ({ citation, organisms }) => {
  const dataSource = 'Biofactoid';
  const getTitle = ({ title }) => [ title ];
  const getComments = citation => {
    const { authors: { abbreviation }, reference, doi, pmid } = citation;
    return _.compact([ reference, abbreviation, doi, pmid ]);
  };
  const title = getTitle( citation );
  const comments = getComments( citation );
  const organism = organisms[0];
  const urlToHomepage = FACTOID_URL;
  return { title, dataSource, comments, organism, urlToHomepage };
};

router.get('/', ( req, res ) => getDocs().then( j => res.json( j ) ) );

router.get('/:id', ( req, res, next ) => {
  let { id }  = req.params;

  Promise.all([getDoc( id ), getDocSbgnJson( id )])
    .then( results => {
      let [ docJson, sbgnJson ] = results;
      const pathwayMetadata = getPathwayMetadata( docJson );
      return _.assign({}, sbgnJson, { pathwayMetadata });
    } )
    .then( j => res.json( j ) )
    .catch( next );
});

module.exports = router;