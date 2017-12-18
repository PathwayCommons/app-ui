const r = require('rethinkdb');
const db = require('./utilities');
const fetch = require('node-fetch');
const Promise = require('bluebird');
let config = require('./config');

const fetchOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const dummyPath = 'https://www.pathwaycommons.org/archives/PC2/dummyPath';
const path = dummyPath;

function saveCommonData(data, releaseID, pcID) {
  return db.connect(config).then((conn) => {
    let pcResult = null;

    let map = Promise.map(data, datum =>{
      if (datum.id == pcID) {
        pcResult = datum; 
      }

      return db.insert('common', { id: datum.id, data: datum, release_id: releaseID }, config, conn);
    });

    if (pcID) {
      return map.then(() => pcResult);
    } else {
      return map;
    }
  });
}

function fetchCommonData(pcID, releaseID) {
  let restCall = (pcID, releaseID) =>
    fetch(path, fetchOptions)
      .then(res => res.json())
      .then(data => saveCommonData(data, releaseID, pcID))
      .catch(() => null);

  if (releaseID) {
    return restCall(pcID, releaseID);
  } else {
    return db.getLatestPCVersion(pcID || 'dummy').then(ver => restCall(pcID, ver));
  }
}


function getCommonData(pcID) {
  return Promise.all([
    db.connect(config).then(connection =>
      r.db(config.databaseName).table('common').get(pcID).run(connection)),
    db.getLatestPCVersion(pcID)
  ]).then(([data, releaseID]) => {
    if (!data || data.release_id != releaseID) {
      return fetchCommonData(pcID, releaseID);
    } else {
      return data.data;
    }
  }).catch(() => null);
}

module.exports = {
  getCommonData,
  setConfig: (conf) => config = conf
};
