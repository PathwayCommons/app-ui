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

const computeFoldChangeMulti = (expression, selectedClass, selectedFunction) => {
  const c1Val = selectedFunction(expression.classValues[selectedClass]);
  let c2Val = Object.entries(expression.classValues)
  .filter(entry => entry[0] !== selectedClass)
  .map(entry => selectedFunction(entry[0][1]));

  if (c2Val === 0) {
    c2Val = 1;
  }

  let foldChange = Math.log2(c1Val / c2Val);

  return {
    geneName: expression.geneName,
    value: parseFloat(foldChange.toFixed(2))
  };
};


const computeFoldChange = (expression, selectedFunction) => {
  const classValues = Object.entries(expression.classValues);
  const c1Val = selectedFunction(classValues[0][1]);

  let c2Val = selectedFunction(classValues[1][1]);
  c2Val = c2Val === 0 ? c2Val = 1 : c2Val;

  let foldChange = Math.log2(c1Val / c2Val);

  return {
    geneName: expression.geneName,
    value: parseFloat(foldChange.toFixed(2))
  };
};

const expressionDataToNodeStyle = (value, range) => {
  const [, max] = range;
  const style = {};

  if ((0 - max / 3) <= value < (0 + max / 3)) {
    style['background-color'] = 'white';
    style['background-opacity'] = 1;
    style['color'] = 'black';
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

const computeFoldChangeRange = (expressionTable, aggregateFn) => {
  const foldValues = expressionTable.rows.map(expression => computeFoldChange(expression, aggregateFn));
  const fvs = foldValues.map(fv => fv.value);
  const maxMagnitude = Math.max(Math.max(...fvs), Math.abs(Math.min(...fvs)));

  const max =  maxMagnitude;
  const min = -maxMagnitude;

  return {min, max};
};

const applyExpressionData = (cy, expressionTable, aggregateFn) => {
  const geneNodes = cy.nodes('[class="macromolecule"]');
  const geneNodeLabels = _.uniq(geneNodes.map(node => node.data('label'))).sort();

  const expressionsInNetwork = expressionTable.rows.filter(row => geneNodeLabels.includes(row.geneName));

  const expressionLabels = expressionsInNetwork.map(expression => expression.geneName);
  geneNodes.filter(node => !expressionLabels.includes(node.data('label'))).style({
    'background-color': 'grey',
    'color': 'grey',
    'opacity': 0.4
  });

  const {min, max} = computeFoldChangeRange(expressionTable, aggregateFn);
  const range = [min, max];

  const nodesInNetworkFoldValues = expressionsInNetwork.map(expression => computeFoldChange(expression, aggregateFn));
  nodesInNetworkFoldValues.forEach(fv => {
    const matchedNodes = cy.nodes().filter(node => node.data('label') === fv.geneName);
    const style = expressionDataToNodeStyle(fv.value, range);

    cy.batch(() => matchedNodes.style(style));
  });
};

class ExpressionTable {
  constructor(rawJsonData) {
    const expressionClasses = _.get(rawJsonData.dataSetClassList, '0.classes', []);
    const expressions = _.get(rawJsonData.dataSetExpressionList, '0.expressions', []);

    this.header = _.uniq(expressionClasses);
    this.rows = expressions.map(expression => createExpressionRow(expression, expressionClasses));
  }
}
module.exports = {computeFoldChange, applyExpressionData, createExpressionTable, computeFoldChangeRange};