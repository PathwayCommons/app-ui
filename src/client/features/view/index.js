const React = require('react');
const h = require('react-hyperscript');

const Menu = require('./components/index.js').Menu;
const Graph = require('./components/index.js').Graph;
const EditWarning = require('./components/index.js').EditWarning;

const lo = require('./layout/');
const make_cytoscape = require('./cy/');
const test = require('./example.js');

const queryString = require('query-string');
const PathwayCommonsService = require('../../services');

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(window.location.search); // TEST VALUE. CHANGE TO props.location.search
    this.state = {
      query: query,
      cy: make_cytoscape({ headless: true }), // cytoscape mounted after Graph component has mounted
      sbgnText: {}, // outdated. graphJSON is used now. Any function using this field needs to be changed
      graphJSON: test.cyjson, // TEST VALUE. CHANGE TO {} in production
      layout: lo.defaultLayout,
      graphRendered: false,
      availableLayouts: [],
      name: '',
      datasource: '',
      warningMessage: '',
      activateWarning: false,
      active_overlay: ''
    };

    //socket.emit(this.state.query.uri)

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
  }

  componentWillReceiveProps( nextProps ) {
    const locationChanged = nextProps.location !== this.props.location;
    if( locationChanged ){
      this.props.logEvent({
        category: 'View',
        action: 'view',
        label: this.state.query.uri
      });
    }
  }
  
  componentWillMount() {
    const editkey = this.state.query.editkey;
    if (editkey != null) {
      // CHECK FOR VALID EDIT KEY HERE
      if (editkey === '12345678') {
        this.setState({warningMessage: 'Be careful! Your changes are live.'});
      } else {
        this.setState({warningMessage: 'Edit key submitted, but invalid.'});
      }
      this.setState({activateWarning: true});
    } else {
      console.log('No edit key submitted');
    }
  }
  
  updateRenderStatus(status) {
    console.log(this.state);
    if (status) {
      const def_layout = lo.getDefaultLayout(this.state.cy.nodes().size());
      console.log('Status is true and layout is '+def_layout);
      this.setState(
        {
          availableLayouts: lo.layoutNames(this.state.cy.nodes().size()),
          graphRendered: status,
          layout: def_layout,
          new_val: true
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

  render() {
    return (
      <div className="View">
        <Menu
          name={this.state.name}
          uri={this.state.query.uri}
          datasource={this.state.datasource}
          active_overlay={this.state.active_overlay}
          cy={this.state.cy}
          changeOverlay={(overlay) => this.handleOverlayToggle(overlay)}
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
          dur={4000}
        >
          {this.state.warningMessage}
        </EditWarning>
      </div>
    );
  }
}

module.exports = View;