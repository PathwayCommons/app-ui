const _ = require('lodash');


// input:
// pathway1: {pathwayId: pathway description, genes: pathway gene sets}
// {pathwayId: pathwayxyz, genes:[gene1, gene2, gene3]}
// {pathwayId: pathwayabc, genes: [gene1, gene3]}
// JC/OC calculation
// output: JSON object
//        {edgeId: pathwayxyz_pathwayabc, intersection: [gene1, gene3], similarity: 0.6}
const similarityRate = (pathway1, pathway2, JCWeight) => {
  let count = 0;
  let intersection = [];
  _.forEach(pathway1.genes, gene => {
    if ((pathway2.genes.filter(ele => ele === gene)).length > 0) {
      ++count;
      intersection.push(gene);
    }
  });
  // JC/OC calculation
  const similarity = JCWeight*(count/(pathway1.genes.length+pathway2.genes.length-count))+(1-JCWeight)*(count/Math.min(pathway1.genes.length, pathway2.genes.length));
  return {edgeId: pathway1.pathwayId+'_'+pathway2.pathwayId, intersection: intersection, similarity: similarity};
};


// input: a list of objects
// [{pathwayId: "pathway1", description: "des1", genes: [gene1, gene2, gene3]},
// {pathwayId: "pathway2", description: "des2", genes: [gene4, gene2]},
// {pathwayId: "pathway3", description: "des3", genes: [gene1]},
// {pathwayId: "pathway4", description: "des4", genes: [gene8, gene1]}]
// output:
// [{edgeId: "pathway1_pathway2", intersection: [gene2], similarity: 0.1},
// {edgeId: "pathway1_pathway3", intersection: [gene1], similarity: 0.1},
// {edgeId: "pathway1_pathway4", intersection: [gene1], similarity: 0.1},
// {edgeId: "pathway2_pathway3", intersection: [], similarity: 0.1},
// {edgeId: "pathway2_pathway4", intersection: [], similarity: 0.1},
// {edgeId: "pathway3_pathway4", intersection: [gene1], similarity: 0.1}]
const similarity = (pathwayList, JCWeight) => {
  const ret = [];
  for (let i = 0; i < pathwayList.length; ++i) {
    for (let j = i + 1; j < pathwayList.length; ++j) {
      ret.push(similarityRate(pathwayList[i], pathwayList[j], JCWeight));
    }
  }
  return ret;
};


// filter out edges with similarity rate < curoff
const filterEdges = (edgeList, cutoff) => {
  return _.filter(edgeList, edge => {
    return edge.similarity >= cutoff;
  });
};


module.exports = { similarity, filterEdges };