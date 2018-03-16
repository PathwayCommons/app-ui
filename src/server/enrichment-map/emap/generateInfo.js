const fetch = require('./fetchInfo').fetch;
const similarity = require('./intersect').similarity;
const filterEdges = require('./intersect').filterEdges;


// input: a list of GO/REACTOME IDs ["GO:1902275", "GO:2001252", "GO:1905269", "GO:0051053"]
// requires: pathwayIds must be valid (returned from gprofiler)
// output:
// [{edgeId: "GO:1902275_GO:2001252", intersection: [gene2], similarity: 0.1},
// {edgeId: "GO:1902275_GO:1905269", intersection: [gene1], similarity: 0.1},
// {edgeId: "GO:1902275_GO:0051053", intersection: [gene1], similarity: 0.1},
// {edgeId: "GO:2001252_GO:0051053", intersection: [gene1], similarity: 0.1}]
// cutoff = 0.375 unless specified
const generateEdgeInfo = (pathwayIdList, cutoff = 0.375) => {
  return filterEdges(similarity(fetch(pathwayIdList)), cutoff);
};


// input: a list of GO/REACTOME IDs ["GO:1902275", "GO:2001252", "GO:1905269", "GO:0051053"]
// requires: pathwayIds must be valid (returned from gprofiler)
// output: a list of objects
// [{pathwayId: "GO:1902275", description: "des1", genes: [gene1, gene2, gene3]},
// {pathwayId: "GO:2001252", description: "des2", genes: [gene4, gene2]},
// {pathwayId: "GO:1905269", description: "des3", genes: [gene1]},
// {pathwayId: "GO:0051053", description: "des4", genes: [gene8, gene1]}]
const generateNodeInfo = (pathwayIdList) => {
  return fetch(pathwayIdList);
};


module.exports = {generateEdgeInfo, generateNodeInfo};