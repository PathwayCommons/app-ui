const _ = require('lodash');

const combineEnrichmentData = (rawEnrichmentClasses, rawEnrichmentDataSets) => {
  const enrichmentDataSets = _.get(rawEnrichmentDataSets, '0', {});

  if (_.isEmpty(enrichmentDataSets)) {
    throw new Error(`No enrichment data found in raw response: ${JSON.stringify(rawEnrichmentDataSets, null, 2)} `);
  }

  const enrichmentClasses = _.get(rawEnrichmentClasses, '0', [].fill('default', 0, enrichmentDataSets.numConditions - 1));

  const enrichmentExpressions = enrichmentDataSets.expressions.map(expression => {
    const augmentedExpression = {
      geneName: expression.geneName,
      values: expression.values.map((value, i) => {
        return {
          value: value,
          'class': enrichmentClasses.classes[i],
          columnName: enrichmentDataSets.columnNames[i]
        };
      })
    };
    return augmentedExpression;
  });

  return enrichmentExpressions;
};

const classes = (rawClassListJSON) => _.uniq(_.get(rawClassListJSON, '0.classes', []));



// class EnrichmentTable {
//   constructor (classList, expressionList) {
//     this.expressions = combineEnrichmentData(classList, expressionList);
//     this.rawClassList = classList;
//     this.rawExpressionList = expressionList;
//   }

//   classes () {
//     return _.uniq(_.get(this.rawClassList, '0', []));
//   }

//   expressions () {
//     return this.expressions;
//   }

//   values (geneName, )
// }

module.exports = combineEnrichmentData;