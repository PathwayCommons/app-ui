const express = require('express');
const Promise = require('bluebird');
const { fetch } = require('../../../util');
const sbgn2CyJson = require('sbgnml-to-cytoscape');
const _ = require('lodash');
const { FACTOID_URL } = require('../../../config');

const router = express.Router();

let getFactoidIdsJson = () => {
  return fetch( FACTOID_URL + 'api/document/', { method: 'get', accept: 'application/json' })
  .then( res => res.json() );
};

let getFactoidJson = ( id ) => {
  return fetch( FACTOID_URL + 'api/document/' + id, { method: 'get', accept: 'application/xml' })
  .then( res => res.json() );
};

// let getFactoidBiopax = ( id ) => {
//   return new Promise( ( resolve, reject ) => {
//     fetch( FACTOID_URL + 'api/document/biopax/' + id, { method: 'get', accept: 'application/vnd.biopax.rdf+xml'})
//     .then( res => res.text() )
//     .then( resolve )
//     .catch( reject );
//   });
// };

let getFactoidSbgn = ( id ) => {
  return new Promise( ( resolve, reject ) => {
    fetch( FACTOID_URL + 'api/document/sbgn/' + id, { method: 'get', accept: 'application/xml'})
      .then( res => res.text() )
      .then( resolve )
      .catch( reject );
  });
};

let getFactoidSbgnJson = id => {
  return (
    getFactoidSbgn( id )
    .then( sbgn => {
      let cyjson = sbgn2CyJson( sbgn );

      return _.assign({}, cyjson, { pathwayMetadata: {} });
    })
  );
};

router.get('/', ( req, res ) => getFactoidIdsJson().then( j => res.json( j ) ) );

router.get('/:factoidDocId', ( req, res, next ) => {
  let { factoidDocId }  = req.params;

  Promise.all([getFactoidJson( factoidDocId ), getFactoidSbgnJson( factoidDocId )])
    .then( results => {
      let [ factoidJson, factoidSbgnJson ] = results;
      let { authorName, name, summary, year, journalName } = factoidJson;

      let docName = !_.isEmpty(name) ? name : 'Factoid Document';

      let title = `${docName} - ${authorName !== '' ? authorName + ' et al.' : '' } ${year !== '' ? year + ',' : ''} ${journalName}`;

      return _.assign({}, factoidSbgnJson, { pathwayMetadata: {
        title: [
          title
        ],
        dataSource: ['Factoid'],
        organism: [
          _.get(factoidJson, 'organisms.0.name', undefined)
        ],
        url: FACTOID_URL + 'document/' + factoidDocId,
        comments: [
          summary
        ]
      }});
    } )
    .then( j => res.json( j ) )
    .catch( next );
});

module.exports = router;