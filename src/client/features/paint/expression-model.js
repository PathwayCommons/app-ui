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

const applyAggregateFn = (row, className, aggregateFn) => {
  const result = aggregateFn(_.get(row, `classValues.${className}`, [])).toFixed(2);
  return parseFloat(result);
};

const maxRelativeTo = (expressionRows, expressionClass, aggregateFn) => {
  const results = expressionRows.map(row => applyAggregateFn(row, expressionClass, aggregateFn));
  return _.max(results);
};

const minRelativeTo = (expressionRows, expressionClass, aggregateFn) => {
  const results = expressionRows.map(row => applyAggregateFn(row, expressionClass, aggregateFn));
  return _.min(results);
};


class ExpressionTable {
  constructor(rawJsonData) {
    const expressionClasses = _.get(rawJsonData.dataSetClassList, '0.classes', []);
    const expressions = _.get(rawJsonData.dataSetExpressionList, '0.expressions', []);

    this.header = _.uniq(expressionClasses);
    this.rows = expressions.map(expression => createExpressionRow(expression, expressionClasses));
  }
}
module.exports = {createExpressionTable, minRelativeTo, maxRelativeTo, applyAggregateFn};