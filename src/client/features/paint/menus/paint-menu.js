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
    let { sortBy, sortType } = this.state;

    let foldChangeExpressions = this.generateFoldChangeList();

    return h('table.expression-table-view', [
      h('thead', [
        h('tr.expression-table-header', [
          h('th.expression-table-header-column', { onClick: () => this.handleSortChange('geneName') }, [
            'Gene',
            sortBy === 'geneName' ? h('i.material-icons', sortType === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down') : null
          ]),
          h('th.expression-table-header-column', { onClick: () => this.handleSortChange('foldChange') }, [
            'Expression Ratio (Log2)',
            sortBy === 'foldChange' ? h('i.material-icons', sortType === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down') : null
          ])
        ])
      ]),
      h('tbody.expression-list', [
        h('tr.expression-entry', [
          h('td.expression-filter', [
            h('input', { placeholder: 'Filter by gene', onChange: e => this.handleSearchChange(e.target.value) }),
          ])
        ]),
        foldChangeExpressions.map( e => {
          return h('tr.expression-entry', { key: e.geneName }, [
            h('td.expression-gene', e.geneName),
            h('td.expression-fold-change', e.foldChange)
          ]);
        })
      ])
    ]);
  }
}


class PathwayResultsListView extends React.Component {
  render(){
    let { pathways, curPathway, expressionTable, controller } = this.props;
    let pathwayResults = pathways.map(pathway => {
      return h('div.paint-search-result', { className: classNames({'paint-search-result-selected': curPathway.uri() === pathway.uri()}), onClick: () => controller.loadPathway(pathway) }, [
        h('h3', pathway.name()),
        h('p', pathway.datasource()),
        h('p', `Genes matched: ${geneIntersection(pathway, expressionTable).length}`)
      ]);
    });

    return h('div.pathways-list', [
      ...pathwayResults
    ]);
  }
}

class PaintMenu extends React.Component {

  analysisFns(){
    return {
      'mean': _.mean,
      'max': _.max,
      'min': _.min
    };
  }

  render() {
    let { cySrv, controller, expressionTable, paintMenuCtrls, curPathway, pathways, selectedIndex } = this.props;
    let { exprClass, exprFn, exprFnName } = paintMenuCtrls;
    let { min, max } = expressionTable.computeFoldChangeRange(exprClass, exprFn);


      let functionSelector = h('div', [
        'Class: ',
        h('select.paint-select', { value: exprFnName,
          onChange: e => controller.handlePaintCtrlChange({
            exprFnName: e.target.value,
            exprFn: this.analysisFns()[e.target.value]
          })
        },
        Object.entries(this.analysisFns()).map(entry => h('option', {value: entry[0]}, entry[0]))
      )
      ]);

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


    return h('div.paint-menu', [
      h(Tabs, { selectedIndex, onSelect: index => controller.handlePaintMenuTabChange(index) }, [
        h(TabList, [
          h(Tab, {
            className: 'paint-drawer-tab',
            selectedClassName: 'paint-drawer-tab-selected',
          }, 'Expression Data'),
          h(Tab, { className: 'paint-drawer-tab', selectedClassName: 'paint-drawer-tab-selected' }, 'Select Pathway')
        ]),
        h(TabPanel, [
          h(ExpressionColourLegend, { min, max }),
          h('div.paint-menu-controls', [
            functionSelector,
            classSelector
          ]),
          h(ExpressionTableView, { cySrv, expressionTable, controller, paintMenuCtrls} ),
        ]),
        h(TabPanel, [
          h(PathwayResultsListView, { controller, curPathway, expressionTable, pathways })
        ])
      ])
    ]);
  }
}

module.exports = PaintMenu;