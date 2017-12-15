const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const bindContextMenu = require('../../../../common/cy/events/contextMenu');

/* Props
- updateRenderStatus(status)
- cy
- graphJSON
*/

class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphId: Math.floor(Math.random() * Math.pow(10, 8)) + 1,
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
    bindContextMenu(this.props.cy);
  }

  componentWillReceiveProps(nextProps) {
    this.checkRenderGraph(nextProps.graphJSON);
  }

  checkRenderGraph(graphJSON) {
    if (!this.state.graphRendered && !_.isEmpty(graphJSON)) { this.renderGraph(graphJSON); }
  }

  // Graph rendering is not tracked by React
  renderGraph(graphJSON) {
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(graphJSON);

    this.props.updateGraphRenderStatus(true);
    //toolTipCreator.bindTippyToElements(cy);
    this.setState({ graphRendered: true });

  }

  render() {
    return h('div.Graph', [
      h('div', {
        id: this.state.graphId,
        ref: dom => this.graphDOM = dom,
        style: {
          width: this.state.width,
          height: this.state.height
        }
      })
    ]);
  }
}

module.exports = Graph;