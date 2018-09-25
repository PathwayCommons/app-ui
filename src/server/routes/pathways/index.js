const uuid = require('uuid');
const express = require('express');
const router = express.Router();

const { getPathwayJson } = require('./generate-pathway-json');

const db = require('../../db');

let findPathwayByUri = uri => {
  return db.accessTable('pathways').then( res => {
    let { table, conn } = res;

    return (
      table.filter({ uri: uri })
        .limit( 1 )
        .run( conn )
        .then( cursor => cursor.toArray() )
        .then( results => {
          if( results.length > 0 ){
            return results[0].network;
          } else {
            return null;
          }
        } )
    );
  });
};

let insertPathway = ( pathwayJson, uri ) => {
  return db.accessTable('pathways').then( res => {
    let { table, conn } = res;

    return (
      table.insert({
        id: uuid(),
        uri: uri,
        network: pathwayJson
      })
      .run( conn )
      .then( () => pathwayJson )
    );
  });
};

let getAndStorePathway = ( uri ) => {
  return getPathwayJson( uri ).then( pathwayJson => insertPathway( pathwayJson, uri ) );
};

router.get('/', ( req, res ) => {
  let uri = req.query.uri;

  findPathwayByUri( uri ).then( result => {
    if( result == null ){
      getAndStorePathway( uri ).then( pathwayJson => res.json( pathwayJson ) );
    } else {
      res.json( result );
    }
  });
});

module.exports = router;