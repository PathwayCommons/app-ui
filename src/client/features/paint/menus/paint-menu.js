const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const classNames = require('classnames');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const { geneIntersection } = require('../expression-table');
const { searchNodes } = require('../cy');

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

    this.state = {
      sortBy: 'geneName',
      sortType: 'asc',
      nodeSearchValue: ''
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
      this.setState({ sortType: sortType === 'asc' ? 'desc' : 'asc'});
    } else {
      this.setState({ sortBy: newSort });
    }
  }

  handleSearchChange(newVal){
    let cy = this.props.cySrv.get();
    this.setState({nodeSearchValue: newVal}, () => searchNodes(cy, newVal));
  }

  generateFoldChangeList(){
    let { expressionTable, paintMenuCtrls } = this.props;
    let { exprClass, exprFn } = paintMenuCtrls;
    let { sortBy, sortType, nodeSearchValue } = this.state;
    let foldChangeExpressions = expressionTable.expressions().map(e => {
      return {
        geneName: e.geneName,
        foldChange: e.foldChange( exprClass, exprFn, 'N/A')
      };
    });

    let sortedFoldChanges = _.orderBy(foldChangeExpressions, [sortBy], [sortType]);

    let filteredFoldChanges = sortedFoldChanges.filter(fc => {
      let upperFc = fc.geneName.toUpperCase();
      let upperFilter = nodeSearchValue.toUpperCase();
      return upperFc.includes(upperFilter) || upperFilter.includes(upperFc);
    });

    return filteredFoldChanges;
  }

  render(){
    let { controller, expressionTable, cySrv, paintMenuCtrls} = this.props;
    let { exprClass, exprFnName } = paintMenuCtrls;

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

    let foldChangeExpressions = this.generateFoldChangeList();

    return h('div.expression-table-view', [
      functionSelector,
      classSelector,
      h('div.expression-table-header', [
        h('div.expression-table-header-column', {onClick: () => this.handleSortChange('geneName') }, 'Gene'),
        h('div.expression-table-header-column', {onClick: () => this.handleSortChange('foldChange') }, 'Expression Ratio'),
      ]),
      h('div.expression-search-filter', [
        h('input', { placeholder: 'Filter by gene', onChange: e => this.handleSearchChange(e.target.value) })
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


class PathwayResultsListView extends React.Component {
  render(){
    let { pathways, curPathway, expressionTable, controller } = this.props;
    let pathwayResults = pathways.map(pathway => {
      return h('div.paint-search-result', { className: classNames({'paint-search-result-selected': curPathway.uri() === pathway.uri()}), onClick: () => controller.loadPathway(pathway) }, [
        h('div', pathway.name()),
        h('div', `Genes matched: ${geneIntersection(pathway, expressionTable).length}`)
      ]);
    });

    return h('div.pathways-list', [
      ...pathwayResults
    ]);
  }
}

class PaintMenu extends React.Component {

  render() {
    let { cySrv, controller, expressionTable, paintMenuCtrls, curPathway, pathways } = this.props;
    let { exprClass, exprFn } = paintMenuCtrls;
    let { min, max } = expressionTable.computeFoldChangeRange(exprClass, exprFn);


    return h(Tabs, [
      h(TabList, [
        h(Tab, 'Expression Data'),
        h(Tab, 'Select Pathway')
      ]),
      h(TabPanel, [
        h(ExpressionColourLegend, { min, max }),
        h(ExpressionTableView, { cySrv, expressionTable, controller, paintMenuCtrls} ),
      ]),
      h(TabPanel, [
        h(PathwayResultsListView, { controller, curPathway, expressionTable, pathways })
      ])
    ]);
  }
}

module.exports = PaintMenu;