const React = require('react');
const h = require('react-hyperscript');

const Menu = require('./components/').Menu;
const Graph = require('./components/').Graph;
const EditWarning = require('./components/').EditWarning;
const Sidebar = require('./components/').Sidebar;

const lo = require('./components/graph/layout/');
const make_cytoscape = require('./cy/');
const bindMove = require('./cy/events/move');

const queryString = require('query-string');
// Eventually all PCS deps will be absorbed into the CDC and we won't use it for anything
const PathwayCommonsService = require('../../services/').PathwayCommonsService;
const CDC = require('../../services/').CDC;

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(window.location.search);
    this.state = {
      query: query,

      cy: null, // cytoscape mounted after Graph component has mounted
      graphJSON: [],
      layout: lo.defaultLayout,
      availableLayouts: [],

      name: '',
      datasource: '',

      activateWarning: this.props.admin || false,
      warningMessage: this.props.admin ? 'Be careful! Your changes are live.' : '',

      activeDisplayedNode: ''
    };

    // Get graph name from PCS
    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(responseObj => {
        let nameStr = responseObj ? responseObj.traverseEntry[0].value.pop() : '';
        // Fallback done here can be replaced with dynamic text for things other than pathways
        nameStr = nameStr ? nameStr : 'Unnamed Pathway';
        this.setState({
          name: nameStr
        });
      });

    // Get graph database from PCS
    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        let dsStr = responseObj ? responseObj.traverseEntry[0].value.pop() : '';
        dsStr = dsStr ? dsStr : 'Unnamed Datasource';
        this.setState({
          datasource: dsStr
        });
      });

    if (this.props.admin) {bindMove(query.uri, 'latest', this.state.cy);}

    // Arrow functions like these tie socket.io directly into the React state
    CDC.initGraphSocket(newGraphJSON => this.setState({graphJSON: newGraphJSON}));
    CDC.requestGraph(query.uri, 'latest');
  }

  componentWillMount(){
    this.setState({
      cy: make_cytoscape({ headless: true }, nodeId => this.setState({activeDisplayedNode: nodeId}))
    });
  }

  // To be called when the graph renders (since this is determined by the Graph class)
  updateRenderStatus(status) {
    if (status) {
      // Layouts must be calculated after the graph loads since there are different
      // layouts depending on graph size
      const def_layout = lo.getDefaultLayout(this.state.cy.nodes().size());
      this.setState(
        {
          availableLayouts: lo.layoutNames(this.state.cy.nodes().size()),
          layout: def_layout
        },
        () => {this.performLayout(this.state.layout);}
      );
    }
  }

  performLayout(layoutName) {
    this.setState({layout: layoutName});
    const cy = this.state.cy;
    cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    cy.layout(lo.layoutMap.get(layoutName)).run();
  }

  render() {
    return (
      h('div.View', [
        h(Menu, {
          name: this.state.name,
          datasource: this.state.datasource,
          layouts: this.state.availableLayouts,
          updateLayout: layout => this.performLayout(layout),
          currLayout: this.state.layout
        }),
        h(Graph, {
          updateRenderStatus: status => this.updateRenderStatus(status),
          updateLayout: () => this.performLayout(this.state.layout),
          cy: this.state.cy,
          graphJSON: this.state.graphJSON
        }),
        h(EditWarning, {
          active: this.state.activateWarning,
          deactivate: () => this.setState({activateWarning: false}),
          dur: 8000
        }, this.state.warningMessage),
        h(Sidebar, {
          cy: this.state.cy,
          uri: this.state.query.uri,
          name: this.state.name,
          datasource: this.state.datasource,
          nodeId: this.state.activeDisplayedNode
        })
      ])
    );
  }
}

module.exports = View;