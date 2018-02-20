const _ = require('lodash');

// path1, path2 are arrays of pathway ids
// [gene1, gene2, gene3]
// [gene1, gene4]
const intersectRate = (pathway1, pathway2) => {
  let count = 0;
  _.forEach(pathway1, gene => {
    if ((pathway2.filter(ele => ele === gene)).length > 0) {
      ++count;
    }
  });
  return count / (pathway1.length + pathway2.length - count);
};

// input:
// [{id: "pathway1", pathway: [gene1, gene2, gene3]},
// {id: "pathway2", pathway: [gene4, gene2]},
// {id: "pathway3", pathway: [gene1]},
// {id: "pathway4", pathway: [gene8, gene1]}]
// output:
// [{source: "pathway1", target: "pathway2", intersection: 0.8},
// {source: "pathway1", target: "pathway3", intersection: 0.8},
// {source: "pathway1", target: "pathway4", intersection: 0.8},
// {source: "pathway2", target: "pathway3", intersection: 0.8},
// {source: "pathway2", target: "pathway4", intersection: 0.8},
// {source: "pathway3", target: "pathway4", intersection: 0.8}]
const intersect = (pathwayList) => {
  let ret = [];
  for (let i = 0; i < pathwayList.length; ++i) {
    for (let j = i + 1; i < pathwayList.length; ++j) {
      ret.push({"source": pathwayList[i].id, "target": pathwayList[j].id, intersection: intersectRate(pathwayList[i].pathway, pathwayList[i].pathway)});
    }
  }
  return ret;
};

module.exports = { intersect };