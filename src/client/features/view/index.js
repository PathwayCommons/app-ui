const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Graph, EditWarning, Sidebar } = require('./components/');

const lo = require('../../common/cy/layout/');
const make_cytoscape = require('../../common/cy/');
const bindMove = require('../../common/cy/events/move');
const queryString = require('query-string');
const { apiCaller } = require('../../services/');

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(props.location.search);
    this.state = {
      query: query,

      cy: null, // cytoscape mounted after Graph component has mounted
      graphJSON: null,
      layoutJSON: null,
      layout: lo.defaultLayout,
      availableLayouts: [],


      metadata: {},

      activateWarning: this.props.admin || false,
      warningMessage: this.props.admin ? 'Be careful! Your changes are live.' : '',
    };


    apiCaller.getGraphAndLayout(query.uri, 'latest').then(graphJSON => {
      this.setState({
        graphJSON: graphJSON.graph,
        layoutJSON: graphJSON.layout,
        metadata: {
          name: _.get(graphJSON, 'graph.pathwayMetadata.title.0', 'Unknown Network'),
          datasource: _.get(graphJSON, 'graph.pathwayMetadata.dataSource.0', 'Unknown Data Source'),
          comments: graphJSON.graph.pathwayMetadata.comments,
          organism: graphJSON.graph.pathwayMetadata.organism
        }
      });
    });
  }

  componentWillMount() {
    this.setState({
      cy: make_cytoscape({ headless: true })
    }, () => {
      if (this.props.admin) {
        bindMove(this.state.query.uri, 'latest', this.state.cy);
      }
    });
  }

  // To be called when the graph renders (since this is determined by the Graph class)
  updateRenderStatus(status) {
    if (status) {
      let layout;
      let availableLayouts = lo.layoutNames(this.state.cy.nodes().size());

      if (this.state.layoutJSON) {
        layout = lo.humanLayoutName;
        availableLayouts.splice(0, 0, lo.humanLayoutName);
      } else {
        layout = lo.getDefaultLayout(this.state.cy.nodes().size());
      }

      this.setState(
        {
          availableLayouts: availableLayouts,
          layout: layout
        },
        () => { this.performLayout(this.state.layout); }
      );
    }
  }

  performLayout(layoutName) {
    this.setState({ layout: layoutName });
    const cy = this.state.cy;

    if (layoutName === lo.humanLayoutName) {
      const layoutJSON = this.state.layoutJSON;
      let options = {
        name: 'preset',
        positions: node => layoutJSON[node.id()],
        animate: true,
        animationDuration: 500
      };
      cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
      cy.layout(options).run();
      return;
    }

    cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    let layout = cy.layout(lo.layoutMap.get(layoutName));
    let that = this;
    layout.pon('layoutstop').then(function () {
      if (that.props.admin && layoutName !== lo.humanLayoutName) {
        let posObj = {};
        cy.nodes().forEach(node => {
          posObj[node.id()] = node.position();
        });
        apiCaller.submitLayoutChange(that.state.query.uri, 'latest', posObj);
      }
    });
    layout.run();
  }

  render() {
    const state = this.state;

    return h('div.View', [
      h(Menu, {
        name: state.metadata.name,
        datasource: state.metadata.datasource,
        layouts: state.availableLayouts,
        updateLayout: layout => this.performLayout(layout),
        cy: state.cy,
        currLayout: state.layout
      }),
      h(Graph, {
        updateRenderStatus: status => this.updateRenderStatus(status),
        updateLayout: () => this.performLayout(state.layout),
        cy: state.cy,
        graphJSON: state.graphJSON
      }),
      h(EditWarning, {
        active: state.activateWarning,
        deactivate: () => this.setState({ activateWarning: false }),
        dur: 5000
      }, state.warningMessage),
      h(Sidebar, {
        cy: state.cy,
        uri: state.query.uri,
        name: state.metadata.name,
        datasource: state.metadata.datasource,
        comments: state.metadata.comments
      })
    ]);
  }
}

module.exports = View;