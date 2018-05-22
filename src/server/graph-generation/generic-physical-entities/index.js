const _ = require('lodash');
const fs = require('fs');
const conf = require("../../../config");
const PC_URI = conf.PC_URI;

const getGenericPhysicalEntityMap = _.memoize(() => JSON.parse(fs.readFileSync(__dirname + '/generic-physical-entity-map.json', 'utf-8')));

const getNodesGeneSynonyms = nodes => {
  const nodeGeneSynonyms = {};
  const genericPhysicalEntityMap = getGenericPhysicalEntityMap();

  nodes.forEach(node => {
    const lookupId = PC_URI + node.data.id;
    nodeGeneSynonyms[node.data.id] = _.get(genericPhysicalEntityMap[lookupId], 'synonyms', []);
  });

  return nodeGeneSynonyms;
};


module.exports = { getNodesGeneSynonyms };