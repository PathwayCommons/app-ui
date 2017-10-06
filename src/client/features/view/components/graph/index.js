const React = require('react');

class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphId: Math.floor(Math.random() * Math.pow(10, 8)) + 1,
      graphEmpty: false,
      graphRendered: false,
      width: '100%',
      height: '100%'
    };
  }

  componentWillUnmount() {
    this.props.cy.destroy();
  }

  componentDidMount() {
    const container = document.getElementById(this.state.graphId);
    this.props.cy.mount(container);
    this.renderGraph(this.props.graphJSON);
  }

  // Graph rendering is not tracked by React
  renderGraph(graphJSON) {
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(graphJSON);
    cy.zoom(0.75); // [NOT WORKING] lets the graph container be large without the graph being obnoxiously big

    //toolTipCreator.bindTippyToElements(cy);
    this.props.updateRenderStatus(true);
  }

  render() {
    if (!this.state.graphEmpty) {
      return (
        <div className='Graph flexCenter'>
          {/* <List className='layoutMenu'>
            <ListItem
              button
              aria-haspopup='true'
              aria-controls='lock-menu'
              aria-label={`Layout | ${this.state.layout}`}
              onClick={(e) => this.setState({layoutMenuOpen: true, layoutMenuAnchorEl: e.currentTarget})}
            >
              <ListItemText
                primary={`Layout | ${this.state.layout}`}
              />
            </ListItem>
          </List>
          <Menu
            anchorEl={this.state.layoutMenuAnchorEl}
            open={this.state.layoutMenuOpen}
            onRequestClose={() => this.setState({layoutMenuOpen: false})}
          >
            {layoutDropdownItems}
          </Menu> */}
          {/* <div className="SpinnerContainer">
            <Spinner hidden={this.state.graphRendered} />
          </div> */}
          <div id={this.state.graphId} style={{
            width: this.state.width,
            height: this.state.height
          }} />
        </div>
      );
    }
    else {
      return (
        // <ErrorMessage className='Graph'>
          <span>No Paths Found</span>
        // </ErrorMessage>
      );
    }
  }
}

module.exports = Graph;