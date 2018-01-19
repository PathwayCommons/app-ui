const _ = require('lodash');


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
  const geneNodeLabels = _.uniq(
    _.flattenDeep(geneNodes.map(node => [node.data('label'), ...(_.get(node.data('geneSynonyms'), 'synonyms', []))])
  )).sort();

  const expressionsInNetwork = expressionTable.expressions().filter(expression => geneNodeLabels.includes(expression.geneName()));

  const expressionLabels = expressionsInNetwork.map(expression => expression.geneName());
  geneNodes.filter(node => _.intersection(expressionLabels, [node.data('label'), ..._.get(node.data('geneSynonyms'), 'synonyms', [])]).length === 0).style({
    'background-color': 'grey',
    'color': 'grey',
    'opacity': 0.4
  });

  const {min, max} = expressionTable.computeFoldChangeRange(selectedClass, selectedFunction);
  const range = [min, max];

  const nodesInNetworkFoldValues = expressionsInNetwork.map(expression => expression.foldChange(selectedClass, selectedFunction));
  nodesInNetworkFoldValues.filter(fv => fv !== Infinity && fv !== -Infinity).forEach(fv => {
    const matchedNodes = cy.nodes().filter(node => node.data('label') === fv.geneName || _.get(node.data('geneSynonyms'), 'synonyms', []).includes(fv.geneName));
    const style = expressionDataToNodeStyle(fv.value, range);

    matchedNodes.style(style);
  });
};



class Expression {
  constructor(rawExpressionData, expressionClasses) {
    const geneName = rawExpressionData.geneName;
    const values = rawExpressionData.values;

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
  }

  foldChange(selectedClass, selectedFunction) {
    const selectedClassValues = this.classValues[selectedClass];
    const nonSelectedClasses = _.omit(this.classValues, [selectedClass]);
  
    const nonSelectedClassesValues =_.flattenDeep(Object.entries(nonSelectedClasses)
      .map(([className, values]) => values));
  
    const c1Val = selectedFunction(selectedClassValues);
  
    let c2Val = _.mean(nonSelectedClassesValues);
  
    if (c2Val === 0) {
      c2Val = 1;
    }
  
    const foldChange = Math.log2(c1Val / c2Val);
  
    return parseFloat(foldChange.toFixed(2));
  }

  geneName() {
    return this.geneName;
  }

  classValues() {
    return this.classValues;
  }
}

class ExpressionTable {
  constructor(rawJsonData) {
    const expressionClasses = _.get(rawJsonData.dataSetClassList, '0.classes', []);
    const expressions = _.get(rawJsonData.dataSetExpressionList, '0.expressions', []);

    this.header = _.uniq(expressionClasses);
    this.rows = [];
    this.expressionMap = new Map();

    for (const expression of expressions) {
      const exp = new Expression(expression, expressionClasses);
      this.rows.push(exp);
      this.expressionMap.set(expression.geneName, exp);
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

module.exports = { ExpressionTable };