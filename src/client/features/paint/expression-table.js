const _ = require('lodash');

let geneIntersection = (pathway, expressionTable) => {
  let genesInPathway = pathway.geneNames();
  let genesInExpressionData = expressionTable.rawExpressions.map( e => e.geneName);

  return _.intersection(genesInPathway, genesInExpressionData);
};

const expressionDataToNodeStyle = (value, range) => {
  const [, max] = range;
  const style = {};

  if ((0 - max / 3) <= value < (0 + max / 3)) {
    style['background-color'] = 'white';
    style['background-opacity'] = 1;
    style['color'] = 'black';
    style['text-outline-color'] = 'white';
  }

  if (value < (0 - max / 3)) {
    style['background-opacity'] = `${Math.abs(value / max)}`;
    style['background-color'] = 'green';
    style['color'] = 'white';
    style['text-outline-color'] = 'black';
  }

  if ((0 + max / 3) <= value ) {
    style['background-color'] = 'purple';
    style['background-opacity'] = `${value / max}`;
    style['color'] = 'white';
    style['text-outline-color'] = 'black';

  }
  return style;
};

const applyExpressionData = (cy, expressionTable, selectedClass, selectedFunction) => {
  const geneNodes = cy.nodes('[class="macromolecule"]');
  const nodeNames = node => [node.data('label'), ..._.get(node.data('metadata'), 'synonyms', [])];
  const geneNodeLabels = _.uniq(
    _.flattenDeep(geneNodes.map(node => nodeNames(node))
  )).sort();

  const expressionsInNetwork = expressionTable.expressions().filter(expression => geneNodeLabels.includes(expression.geneName));

  const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);
  geneNodes.filter(node => _.intersection(expressionLabels, nodeNames(node)).length === 0).style({
    'background-color': 'grey',
    'color': 'grey',
    'opacity': 0.4
  });

  const {min, max} = expressionTable.computeFoldChangeRange(selectedClass, selectedFunction);
  const range = [min, max];

  expressionsInNetwork.forEach(expression => {
    const fv = expression.foldChange(selectedClass, selectedFunction);

    if (fv !== Infinity && fv !== -Infinity) {

      const matchedNodes = cy.nodes().filter(node => nodeNames(node).includes(expression.geneName));

      const style = expressionDataToNodeStyle(fv, range);
      matchedNodes.style(style);
    }

  });
};



class Expression {
  constructor(rawExpressionData, expressionClasses) {
    const geneName = rawExpressionData.geneName;
    const values = rawExpressionData.values;
    const replacedExpression = rawExpressionData.replaced ? rawExpressionData.replaced : {};

    const class2ValuesMap = new Map();

    for (const expressionClass of _.uniq(expressionClasses)) {
      class2ValuesMap.set(expressionClass, []);
    }

    for (let i = 0; i < values.length; i++) {
      class2ValuesMap.get(expressionClasses[i]).push(values[i]);
    }

    const classValues = {};
    Array.from(class2ValuesMap.entries()).forEach(entry => {
      const className = entry[0];
      const values = entry[1];
      classValues[className] = values;
    });

    this.geneName = geneName;
    this.classValues = classValues;
    this.replacedExpression = replacedExpression;
  }

  foldChange(selectedClass, selectedFunction, invalidValueReplacement = null) {
    const selectedClassValues = this.classValues[selectedClass];
    const nonSelectedClasses = _.omit(this.classValues, [selectedClass]);

    const nonSelectedClassesValues =_.flattenDeep(Object.entries(nonSelectedClasses)
      .map(([className, values]) => values));// eslint-disable-line no-unused-vars

    const c1Val = selectedFunction(selectedClassValues);

    let c2Val = _.mean(nonSelectedClassesValues);

    if (c2Val === 0) {
      c2Val = 1;
    }

    const foldChange = Math.log2(c1Val / c2Val);

    if (foldChange === Infinity || foldChange === -Infinity) {
      return invalidValueReplacement;
    }

    return parseFloat(foldChange.toFixed(2));
  }
}


const createRawExpressions = (expressionJSON, networkJSON) => {
  const expressionByGeneName = new Map();

  expressionJSON.forEach(expression => {
    expressionByGeneName.set(expression.geneName, expression);
  });

  networkJSON.nodes.forEach(node => {
    const label = _.get(node, 'data.label', '');
    const synonyms = _.get(node, 'data.metadata.synonyms', []);
    const geneIntersection =  _.intersection([...expressionByGeneName.keys()], synonyms);
    const isGenericMapping = !expressionByGeneName.has(label) && geneIntersection.length > 0;

    if (isGenericMapping) {
      const mappingCandidate = geneIntersection[0];
      const existingExpression = expressionByGeneName.get(mappingCandidate);
      expressionByGeneName.delete(mappingCandidate);
      expressionByGeneName.set(label, {geneName: label, values: existingExpression.values, replaced: existingExpression});

      for (const gene of geneIntersection) {
        expressionByGeneName.delete(gene);
      }
    }
  });

  return [...expressionByGeneName.entries()].map(entry => entry[1]);
};

class ExpressionTable {
  constructor() {
    this.loaded = false;
  }

  load( rawJsonData ){
    this.raw = rawJsonData;
    let rawExpressionClasses = _.get(rawJsonData.dataSetClassList, '0.classes', []);
    let rawExpressions = _.get(rawJsonData.dataSetExpressionList, '0.expressions', []);

    this.rawExpressions = rawExpressions;
    this.rawExpressionClasses = rawExpressionClasses;
    this.classes = _.uniq(rawExpressionClasses);
    this.loaded = true;

  }

  loadPathway( pathwayJSON ){
    if( !this.loaded ){
      throw new Error('You must call load() with enrichment JSON first');
    }

    let expressionClasses = this.rawExpressionClasses;
    let expressions = createRawExpressions(this.rawExpressions, pathwayJSON);
    this.rows = [];
    this.expressionMap = new Map();

    for (let rawExpression of expressions) {
      let exp = new Expression(rawExpression, expressionClasses);
      this.rows.push(exp);
      this.expressionMap.set(rawExpression.geneName, exp);
    }

  }

  expressions(geneName = null) {
    if (geneName != null) {
      if (this.expressionMap.has(geneName)) {
        return [this.expressionMap.get(geneName)];
      } else {
        return [];
      }
    }
    return this.rows;
  }

  foldChange(selectedClass, selectedFunction) {
    const results = new Map();

    this.rows.forEach(expression => {
      const foldChange = expression.foldChange(selectedClass, selectedFunction);
      results.set(expression.geneName, foldChange);
    });

    return results;
  }

  computeFoldChangeRange(selectedClass, selectedFunction) {
    const foldValues = this.rows.map(expression => expression.foldChange(selectedClass, selectedFunction));
    const fvs = foldValues.filter(fv => fv !== Infinity && fv !== -Infinity);
    const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));

    const max =  maxMagnitude;
    const min = -maxMagnitude;

    return {min, max};
  }
}

module.exports = { ExpressionTable, applyExpressionData, geneIntersection };