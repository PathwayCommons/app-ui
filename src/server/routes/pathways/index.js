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
        .limit(1)
        .run(conn)
        .then( cursor => cursor.toArray())
    );
  });
};

let insertPathway = (pathwayJson, uri) => {
  return db.accessTable('pathways').then( res => {
    let { table, conn } = res;

    return table.insert({
      id: uuid(),
      uri: uri,
      network: pathwayJson
    }).run(conn);
  });
};

router.get('/', ( req, res ) => {
  let uri = req.query.uri;

  findPathwayByUri( uri ).then( result => {
    if( result.length == 0 ){
      getPathwayJson( uri )
      .then( pathwayJson => {
        return insertPathway( pathwayJson ).then( () => pathwayJson );
      })
      .then( pathwayJson => {
        res.json( pathwayJson );
      });
    } else {
      let { network } = result;
      res.json( network );
    }
  });
});

module.exports = router;