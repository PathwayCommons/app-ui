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
const PathwayCommonsService = require('../../services/index.js').PathwayCommonsService;
const CDC = require('../../services/index.js').CDC;

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(window.location.search); // TEST VALUE. CHANGE TO props.location.search
    this.state = {
      query: query,
      cy: make_cytoscape({ headless: true }), // cytoscape mounted after Graph component has mounted
      graphJSON: [],
      layout: lo.defaultLayout,
      graphRendered: false,
      availableLayouts: [],
      name: '',
      datasource: '',
      warningMessage: '',
      activateWarning: false,
      sidebarOpen: false,
      sidebarMenu: '',
      admin: false
    };

    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(responseObj => {
        this.setState({
          name: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        this.setState({
          datasource: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });

    // props.logPageView( props.history.location );
    // props.logEvent({
    //   category: 'View',
    //   action: 'view',
    //   label: query.uri
    // });
    this.updateGraphJSON = this.updateGraphJSON.bind(this);
  }

  // componentWillReceiveProps( nextProps ) {
  //   const locationChanged = nextProps.location !== this.props.location;
  //   if( locationChanged ){
  //     this.props.logEvent({
  //       category: 'View',
  //       action: 'view',
  //       label: this.state.query.uri
  //     });
  //   }
  // }

  updateGraphJSON(newGraphJSON) {
    this.setState({graphJSON: newGraphJSON});
  }
  
  componentWillMount() {
    const editkey = this.state.query.editkey;
    if (editkey != null) {
      CDC.initEditKeyValidation((valid) => {
        this.setState({
          admin: valid,
          activateWarning: valid,
          warningMessage: 'Be careful! Your changes are live.'
        });
        if (valid) {
          bindMove(this.state.query.uri, 'latest', editkey, this.state.cy);
        }
      });
      CDC.requestEditKeyValidation(this.state.query.uri, 'latest', editkey);
    }

    CDC.initLayoutSocket(this.updateGraphJSON);
    CDC.requestGraph(this.state.query.uri, 'latest');
  }
  
  updateRenderStatus(status) {
    if (status) {
      const def_layout = lo.getDefaultLayout(this.state.cy.nodes().size());
      this.setState(
        {
          availableLayouts: lo.layoutNames(this.state.cy.nodes().size()),
          graphRendered: status,
          layout: def_layout
        },
        () => {
          this.performLayout(this.state.layout);
        }
      );
    } else {
      this.setState({graphRendered: status});
    }
  }

  performLayout(layoutName) {
    this.setState({layout: layoutName});
    const cy = this.state.cy;
    cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    cy.layout(lo.layoutMap.get(layoutName)).run();
  }

  handleUpdateSidebar(menu) {
    this.setState({
      sidebarMenu: menu,
      sidebarOpen: true
    });
  }

  render() {
    // console.log('VIEW RENDERED');
    return (
      <div className="View">
        <Menu
          name={this.state.name}
          nameFallback='Unnamed Pathway'
          datasource={this.state.datasource}
          datasourceFallback='Unnamed Datasource'
          layouts={this.state.availableLayouts}
          updateLayout={(layout) => this.performLayout(layout)}
          currLayout={this.state.layout}
        />
        <Graph
          updateRenderStatus={(status) => this.updateRenderStatus(status)}
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
          open={this.state.sidebarOpen}
          menu={this.state.sidebarMenu}
          closeMenu={() => this.setState({sidebarOpen: false})}
          cy={this.state.cy}
          uri={this.state.query.uri}
          name={this.state.name}
        />
      </div>
    );
  }
}

module.exports = View;