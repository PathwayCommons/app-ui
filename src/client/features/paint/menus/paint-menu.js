const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { applyExpressionData } = require('../expression-table');
// const classNames = require('classnames');
// const Table = require('react-table').default;
// const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
// const matchSorter = require('match-sorter').default;

// const cysearch = _.debounce(require('../../common/cy/match-style'), 500);

// const { ExpressionTable, applyExpressionData } = require('./expression-table');

class ExpressionColourLegend extends React.Component {
  render(){
    let { min, max } = this.props;

    return h('div.paint-legend', [
      h('p', `low ${min}`),
      h('p', `high ${max}`)
    ]);
  }
}

class ExpressionTableView extends React.Component {
  constructor(props){
    super(props);

    let { SORT_GENE, SORT_ASC } = this.sortTypes();

    this.state = {
      sortBy: SORT_GENE,
      sortType: SORT_ASC,
      nodeSearchValue: ''
    };
  }

  sortTypes(){
    return {
      SORT_GENE: 0,
      SORT_FOLD_CHANGE: 1,
      SORT_ASC: 0,
      SORT_DESC: 1
    };
  }

  analysisFns(){
    return {
      'mean': _.mean,
      'max': _.max,
      'min': _.min
    };
  }

  handleSortChange(newSort){
    let { sortBy, sortType } = this.state;

    if( newSort == sortBy ){
      this.setState({ sortType: !sortType });
    } else {
      this.setState({ sortBy: newSort });
    }
  }

  render(){
    let { controller, expressionTable, cySrv, paintMenuCtrls} = this.props;
    let { exprClass, exprFn, exprFnName } = paintMenuCtrls;
    let { sortBy, sortType } = this.state;

    let functionSelector = h('select.paint-select', {
        value: exprFnName,
        onChange: e => controller.handlePaintCtrlChange({ 
          exprFnName: e.target.value, 
          exprFn: this.analysisFns()[e.target.value]
        })
      },
      Object.entries(this.analysisFns()).map(entry => h('option', {value: entry[0]}, entry[0]))
    );

    let classSelector = h('div', [
      'Compare: ',
      h('select.paint-select', {
        value: exprClass,
        onChange: e => controller.handlePaintCtrlChange({exprClass: e.target.value})
      },
      expressionTable.classes.map(cls => h('option', { value: cls}, cls))
      ),
      ` vs ${_.difference(expressionTable.classes, [exprClass])}`
    ]);

    let foldChangeExpressions = expressionTable.expressions().map(e => {
      return {
        geneName: e.geneName,
        foldChange: e.foldChange( exprClass, exprFn, 'N/A')
      };
    }).sort( (e0, e1) => {
      let sortField = sortBy ? 'geneName' : 'foldChange';
      return sortType ? e0[sortField] > e1[sortField] : e1[sortField] > e0[sortField];
    });

    return h('div.expression-table-view', [
      functionSelector,
      classSelector,
      h('div.expression-table-header', [
        h('div.expression-table-header-column', {onClick: () => this.handleSortChange(this.sortTypes().SORT_GENE) }, 'Gene'),
        h('div.expression-table-header-column', {onClick: () => this.handleSortChange(this.sortTypes().SORT_FOLD_CHANGE) }, 'Expression Ratio'),  
      ]),
      h('div.expression-search-filter', [
        h('input', { placeholder: 'Filter by gene' })
      ]),
      h('div.expression-list', foldChangeExpressions.map( e => {
        return h('div.expression-entry', [
          h('div.gene', e.geneName),
          h('div.fold-change', e.foldChange)
        ]);
      }))
    ]);
  }
}

class PaintMenu extends React.Component {
  constructor(props) {
    super(props);

    // this.state = {
    //   selectedFunction: this.analysisFns().mean,
    //   selectedClass: props.selectedClass,
    //   selectedSearchResult: props.selectedSearchResult,
    //   loading: false
    // };
  }


  render() {
    let { cySrv, controller, expressionTable, paintMenuCtrls, curPathway, pathways } = this.props;
    let { exprClass, exprFn } = paintMenuCtrls;
    let { min, max } = expressionTable.computeFoldChangeRange(exprClass, exprFn);

    let pathwayResults = pathways.map(result => {
      return h('div', { onClick: () => controller.loadPathway(result.pathway) }, [
        h('div', result.pathway.name())
      ]);
    });

    return h('div.paint-menu', [
      h(ExpressionColourLegend, { min, max }),
      h(ExpressionTableView, { cySrv, expressionTable, controller, paintMenuCtrls} ),
      pathwayResults
    ]);
  }
}

module.exports = PaintMenu;