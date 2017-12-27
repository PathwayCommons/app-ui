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

// getGraphFallback(pcID, releaseID, connection)
// Retrieves the graph specified by (pcID, releaseID) if something
// goes wrong with the request for a graph. It executes a lazyload
// and tries to save this new information to the database to avoid the
// issue in the future.
function getGraphFallback(pcID, releaseID, connection) {
  return query.getGraphFromPC(pcID, releaseID, connection);
}

// getGraphAndLayout(pcID, releaseID)
// return both the graph and the most recent layout
// specified by (pcID, releaseID). It wll execute a
// series of fallbacks if something goes wrong.
function getGraphAndLayout(pcID, releaseID) {
  return db.connect().then((connection) => {
    return Promise.all([
      query.getGraph(pcID, releaseID, connection).catch(() => getGraphFallback(pcID, releaseID, connection)),
      query.getLayout(pcID, releaseID, connection).catch(() => Promise.resolve(null))
    ]).then(([graph, layout]) => {
      return { graph, layout };
    }).catch((e)=>{
      logger.error(e);
      return `ERROR : could not retrieve graph for ${pcID}`;
    });
  });
}

// submitLayout(pcID, releaseID, layout, userID)
// saves the given layout and the id of the user to the version specified by
// (pcID, releaseID)
function submitLayout(pcID, releaseID, layout, userID) {
  //Get the requested layout
  return db.connect().then((connection) => {
    update.saveLayout(pcID, releaseID, layout, userID, connection);
    return 'Layout was updated.';

  }).catch((e) => {
    logger.error(e);
    return 'ERROR: Something went wrong in submitting the layout';
  });
}

// submitGraph(pcID, releaseID, newGraph) saves the given graph
// to the version specified by (pcID, releaseID)
function submitGraph(pcID, releaseID, newGraph) {
  return db.connect().then((connection) => {
    return update.updateGraph(pcID, releaseID, newGraph, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// submitDiff(pcID, releaseID, diff, userID) updates the saved
// layout with the given diff for the version specified by (pcID, releaseID)
function submitDiff(pcID, releaseID, diff, userID) {
  return db.connect().then((connection) => {
    return diffSaver.saveDiff(pcID, releaseID, diff, userID, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// endSession(pcID, releaseID, userID) removes the userID from the list
// of users editing the pathway specified by  (pcID, releaseID)
function endSession(pcID, releaseID, userID) {
  return db.connect().then((connection) => {
    return diffSaver.popUser(pcID, releaseID, userID, connection);
  });
}

function getPathwayLevelMetadata(uri) {

  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pcServices.traverse({uri, path}).then(getValue);

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

const pathways = async () => {
  return db.connect().then(connection => {
    return r.db(config.databaseName).table('pathways').get(10).run(connection);
  });
}

const getPathway = async (uri) => {
  return pathway = db.connect().then(connection => {
    return r.db(config.databaseName)
      .table('pathways')
      .get(uri)
      .run(connection);
  });
}


module.exports = {
  submitLayout,
  submitGraph,
  submitDiff,
  endSession,
  getGraphAndLayout,
  generatePathways,
  getPathway,
  pathways
};