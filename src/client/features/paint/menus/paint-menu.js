const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
// const classNames = require('classnames');
// const Table = require('react-table').default;
// const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
// const matchSorter = require('match-sorter').default;

// const cysearch = _.debounce(require('../../common/cy/match-style'), 500);

// const { ExpressionTable, applyExpressionData } = require('./expression-table');

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

  analysisFns() {
    return {
      mean: {
        name: 'mean',
        func: _.mean
      },
      max: {
        name: 'max',
        func: _.max
      },
      min: {
        name: 'min',
        func: _.min
      }
    };
  }

  // loadNetwork(networkJSON) {
  //   const updateBaseViewState = this.props.updateBaseViewState;
  //   const cy = this.props.cy;
  //   const nextExpressionTable = new ExpressionTable(this.props.rawExpressions, networkJSON);
  //   updateBaseViewState({
  //     networkMetadata: {
  //       uri: networkJSON.pathwayMetadata.uri,
  //       name: _.get(networkJSON, 'pathwayMetadata.title.0', 'Unknown Network'),
  //       datasource: _.get(networkJSON, 'pathwayMetadata.dataSource.0', 'Unknown Data Source'),
  //       comments: networkJSON.pathwayMetadata.comments,
  //       organism: networkJSON.pathwayMetadata.organism
  //     }
  //   });

  //   updateBaseViewState({
  //     expressionTable: nextExpressionTable,
  //     networkLoading: true
  //     }, () => {
  //     cy.remove('*');
  //     cy.add({nodes: networkJSON.nodes, edges: networkJSON.edges});
  //     const layout = cy.layout({name: 'cose-bilkent'});
  //     layout.on('layoutstop', () => {
  //       applyExpressionData(this.props.cy, this.props.expressionTable, this.state.selectedClass, this.state.selectedFunction.func);
  //       updateBaseViewState({networkLoading: false});
  //     });
  //     layout.run();
  //   });
  // }


  render() {
    let { cySrv, controller,  curPathway, pathways } = this.props;

    return h('div.paint-menu', pathways.map(p => {
      return h('div', { onClick: () => controller.loadPathway(p) }, [
        h('div', p.name())
      ]);
      })
    );
  }
}

module.exports = PaintMenu;