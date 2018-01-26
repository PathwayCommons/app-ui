const validateGenes = geneList => {
  for (const gene of geneList) {
    validate(gene);
  }

  if (allValid(genesList)) {
    return {
      msg: 'input is good'
    }
  }
  return {
    msg: 'input is bad'
  }
}


module.exports = validateGenes;