// cleanUpEntrez(initialAlias) takes the string initialAlias under initial alias
// from g:Convert and cleans up ENTREZGENE_ACC: prefix before integers
const cleanUpEntrez = (initialAlias) => {
  const colonIndex = 14;
  if (initialAlias.substring(0, colonIndex + 1) === 'ENTREZGENE_ACC:') {
    const ncbiNameIndex = 1;
    initialAlias = initialAlias.split(':')[ncbiNameIndex];
  }
  return initialAlias;
}


module.exports = { cleanUpEntrez };