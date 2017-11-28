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

    // const classValues = Array.from(class2ValuesMap.entries()).map(entry => {
    //   const className = entry[0];
    //   const values = entry[1];
    //   const ret = {};
    //   ret[className] = values;

    //   return ret;
    // });

    const classValues = Array.from(class2ValuesMap.entries()).map((entry =>  _.mean(entry[1]).toFixed(2)));

    return { geneName, classValues };
};

const createExpressionTable = (expressions, expressionClasses) => {

  const header = _.uniq(expressionClasses);
  const rows = expressions.map(expression => createExpressionRow(expression, expressionClasses));

  return {header, rows};
};

module.exports = createExpressionTable;