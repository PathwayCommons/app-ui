//Import Depedencies
const query = require('./../database/query');
const db = require('./../database/utilities');
const update = require('./../database/update');
const logger = require('./../logger');
const diffSaver = require('./../database/saveDiffs');
const pathwayUris = require('../../scripts/valid_pathway_uris.json');
const config = require('../database/config');
const pcServices = require('../pathway-commons');
const r = require('rethinkdb');


function getPathwayLevelMetadata(uri) {
  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pcServices.query({cmd:'traverse', uri, path}).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    // get('Entity/comment').then(value => comments = value),
    // get('Entity/organism/displayName').then(value => organism = value)
  ]).then(data => {
    return { dataSource, title };
  });
}


const generatePathways = async () => {
  const connection = await db.connect();
  const uris = pathwayUris;
  let i = 0;

  for (const uri of uris) {
    const pathwayMetadata = await getPathwayLevelMetadata(uri);
    console.log(i, pathwayMetadata);
    i++;
    const pathway = {
      id: uri,
      name: pathwayMetadata.title,
      datasource: pathwayMetadata.dataSource,
      // comments: pathwayMetadata.comments,
      // organism: pathwayMetadata.organism
    };
    db.insert('pathways', pathway, config, connection);
  }
};

// generatePathways();

