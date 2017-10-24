/**
  Pathway Commons Viewer

  View

  Purpose:  Create the view app and render all subcomponents

  Props:    None now, but eventually it should take some props from react-router

  Note:

  To do: 

  @author Jonah Dlin
  @version 1.1 2017/10/17
**/

const React = require('react');
const h = require('react-hyperscript');

const Menu = require('./components/index.js').Menu;
const Graph = require('./components/index.js').Graph;
const EditWarning = require('./components/index.js').EditWarning;
const Sidebar = require('./components/index.js').Sidebar;

const lo = require('./layout/');
const make_cytoscape = require('./cy/');
const bindMove = require('./cy/events/move.js');

const queryString = require('query-string');
// Eventually all PCS deps will be absorbed into the CDC and we won't use it for anything
const PathwayCommonsService = require('../../services/index.js').PathwayCommonsService;
const CDC = require('../../services/index.js').CDC;

// window.onbeforeunload = sendSessionEnd;
// function sendSessionEnd(){
//    CDC.submitSessionEnd();
//    return null;
// }

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(window.location.search);
    this.state = {
      query: query,

      cy: make_cytoscape({ headless: true }), // cytoscape mounted after Graph component has mounted
      graphJSON: [],
      layout: lo.defaultLayout,
      availableLayouts: [],

      name: '',
      datasource: '',

      activateWarning: false,
      warningMessage: '',

      admin: false
    };

    // Get graph name from PCS
    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(responseObj => {
        var nameStr = responseObj ? responseObj.traverseEntry[0].value.pop() : '';
        // Fallback done here can be replaced with dynamic text for things other than pathways
        nameStr = nameStr ? nameStr : 'Unnamed Pathway';
        this.setState({
          name: nameStr
        });
      });

    // Get graph database from PCS
    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        var dsStr = responseObj ? responseObj.traverseEntry[0].value.pop() : '';
        dsStr = dsStr ? dsStr : 'Unnamed Datasource';
        this.setState({
          datasource: dsStr
        });
      });
  }

  componentWillMount() {
    // Before we mount we get the edit key from the URL
    // The validation performed here only occurs once, on View mount,
    // and is for initializing access privileges. To the regular user,
    // the move event does not need to be bound. The downside is that
    // there is no way to add an edit key part-way through a session.
    const editkey = this.state.query.editkey;
    if (editkey != null) {
      CDC.initEditKeyValidationSocket((valid) => {
        if (typeof valid === typeof {}) {alert('Key validation error!'); return;}
        this.setState({
          admin: valid,
          activateWarning: valid, // this activates the warning tab
          warningMessage: 'Be careful! Your changes are live.'
        });
        if (valid) {
          // Bind move event only if necessary
          bindMove(this.state.query.uri, 'latest', editkey, this.state.cy);
        }
      });
      CDC.requestEditKeyValidation(this.state.query.uri, 'latest', editkey);
    }

    window.addEventListener('resize', () => window.scrollTo(0, 1));

    // Arrow functions like these tie socket.io directly into the React state
    CDC.initGraphSocket(newGraphJSON => this.setState({graphJSON: newGraphJSON}));
    CDC.requestGraph(this.state.query.uri, 'latest');
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
      <div className="View">
        <Menu
          // These fallbacks are here in case we want to set them dynamically based off
          // of things like type in the future (when we expand beyond pathways)
          name={this.state.name}
          datasource={this.state.datasource}
          layouts={this.state.availableLayouts}
          updateLayout={(layout) => this.performLayout(layout)}
          currLayout={this.state.layout}
        />
        <Graph
          updateRenderStatus={status => this.updateRenderStatus(status)}
          updateLayout={() => this.performLayout(this.state.layout)}
          cy={this.state.cy}
          graphJSON={this.state.graphJSON}
        />
        <EditWarning
          active={this.state.activateWarning}
          deactivate={() => this.setState({activateWarning: false})}
          dur={8000}
        >
          {this.state.warningMessage}
        </EditWarning>
        <Sidebar
          // These are useful for the information section and later for the metadata section
          cy={this.state.cy}
          uri={this.state.query.uri}
          name={this.state.name}
          datasource={this.state.datasource}
        />
      </div>
    );
  }
}

module.exports = View;