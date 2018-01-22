const _ = require('lodash');

const createExpressionRow = (expression, expressionClasses) => {
    const geneName = expression.geneName;
    const values = expression.values;

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
    return { geneName, classValues };
};

const createExpressionTable = (expressions, expressionClasses) => {

  const header = _.uniq(expressionClasses);
  const rows = expressions.map(expression => createExpressionRow(expression, expressionClasses));

  return {header, rows};
};

const computeFoldChange = (expression, selectedClass, selectedFunction) => {
  const selectedClassValues = expression.classValues[selectedClass];
  const nonSelectedClasses = _.omit(expression.classValues, [selectedClass]);


  const nonSelectedClassesValues =_.flattenDeep(Object.entries(nonSelectedClasses)
    .map(([className, values]) => values));

  const c1Val = selectedFunction(selectedClassValues);

  let c2Val = _.mean(nonSelectedClassesValues);

  if (c2Val === 0) {
    c2Val = 1;
  }

  const foldChange = Math.log2(c1Val / c2Val);

  return {
    geneName: expression.geneName,
    value: parseFloat(foldChange.toFixed(2))
  };
};

const expressionDataToNodeStyle = (value, range) => {
  const [, max] = range;
  const style = {};

  if (value === Infinity || value === -Infinity) return style;

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

const computeFoldChangeRange = (expressionTable, selectedClass, selectedFunction) => {
  const foldValues = expressionTable.rows.map(expression => computeFoldChange(expression, selectedClass, selectedFunction));
  const fvs = foldValues.map(fv => fv.value).filter(fv => fv !== Infinity && fv !== -Infinity);
  const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));

  const max =  maxMagnitude;
  const min = -maxMagnitude;

  return {min, max};
};

const applyExpressionData = (cy, expressionTable, selectedClass, selectedFunction) => {
  const geneNodes = cy.nodes('[class="macromolecule"]');
  const geneNodeLabels = _.uniq(
    _.flattenDeep(geneNodes.map(node => [node.data('label'), ...(_.get(node.data('geneSynonyms'), 'synonyms', []))])
  )).sort();

  const expressionsInNetwork = expressionTable.rows.filter(row => geneNodeLabels.includes(row.geneName));

  const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);
  geneNodes.filter(node => _.intersection(expressionLabels, [node.data('label'), ..._.get(node.data('geneSynonyms'), 'synonyms', [])]).length === 0).style({
    'background-color': 'grey',
    'color': 'grey',
    'opacity': 0.4
  });

  const {min, max} = computeFoldChangeRange(expressionTable, selectedClass, selectedFunction);
  const range = [min, max];

  const nodesInNetworkFoldValues = expressionsInNetwork.map(expression => computeFoldChange(expression, selectedClass, selectedFunction));
  nodesInNetworkFoldValues.filter(fv => fv !== Infinity && fv !== -Infinity).forEach(fv => {
    const matchedNodes = cy.nodes().filter(node => node.data('label') === fv.geneName || _.get(node.data('geneSynonyms'), 'synonyms', []).includes(fv.geneName));
    const style = expressionDataToNodeStyle(fv.value, range);

    matchedNodes.style(style);
  });
};

module.exports = {computeFoldChange, applyExpressionData, createExpressionTable, computeFoldChangeRange};