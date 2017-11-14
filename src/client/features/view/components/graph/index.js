const React = require('react');
const h = require('react-hyperscript');

const _ = require('lodash');

/* Props
- updateRenderStatus(status)
- updateLayout()
- cy
- graphJSON
*/

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
    const container = this.graphDOM;
    this.props.cy.mount(container);
    this.checkRenderGraph(this.props.graphJSON);
  }

  componentWillReceiveProps(nextProps) {
    this.checkRenderGraph(nextProps.graphJSON);
  }

  // isempty part should be moved to a more communal file
  // retrieved from https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
  checkRenderGraph(graphJSON) {
    if (!this.state.graphRendered && !_.isEmpty(graphJSON)) { this.renderGraph(graphJSON); }
  }

  // Graph rendering is not tracked by React
  renderGraph(graphJSON) {
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(graphJSON);

    //toolTipCreator.bindTippyToElements(cy);
    this.props.updateRenderStatus(true);
    this.setState({graphRendered: true});
  }

  render() {
    if (!this.state.graphEmpty) {
      return (
        h('div.Graph', [
          h('div', {
            id: this.state.graphId,
            ref: dom => this.graphDOM = dom,
            style: {
              width: this.state.width,
              height: this.state.height
            }
          })
        ])
      );
    } else {
      return (
        h('span', 'No Graph Found')
      );
    }
  }
}

module.exports = Graph;