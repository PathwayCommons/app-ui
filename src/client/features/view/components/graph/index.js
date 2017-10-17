const React = require('react');

class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphId: Math.floor(Math.random() * Math.pow(10, 8)) + 1,
      graphEmpty: false,
      graphRendered: false,
      width: '100vw',
      height: '100vh'
    };
  }

  componentWillUnmount() {
    this.props.cy.destroy();
  }

  componentDidMount() {
    const container = document.getElementById(this.state.graphId);
    this.props.cy.mount(container);
    this.checkRenderGraph(this.props.graphJSON);
  }

  componentWillReceiveProps(nextProps) {
    this.checkRenderGraph(nextProps.graphJSON);
  }

  // isempty part should be moved to a more communal file
  // retrieved from https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
  checkRenderGraph(graphJSON) {
    if (this.state.graphRendered) return;
    var empty = true;    
    for(var key in graphJSON) {
        if(graphJSON.hasOwnProperty(key))
            empty = false;
    }
    if (!empty) this.renderGraph(graphJSON);
  }

  // Graph rendering is not tracked by React
  renderGraph(graphJSON) {
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(graphJSON);
    
    cy.zoom(0.75); // [NOT WORKING]

    //toolTipCreator.bindTippyToElements(cy);
    this.props.updateRenderStatus(true);
    this.setState({graphRendered: true});
  }

  render() {
    if (!this.state.graphEmpty) {
      return (
        <div className='Graph flexCenter'>
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