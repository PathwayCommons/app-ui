const React = require('react');
const h = require('react-hyperscript');

const _ = require('lodash');

/* Props
- updateNetworkRenderStatus(status)
- cy
- networkJSON
*/

class Network extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      networkId: Math.floor(Math.random() * Math.pow(10, 8)) + 1,
      networkRendered: false,
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
    this.checkRenderNetwork(this.props.networkJSON);
  }

  componentWillReceiveProps(nextProps) {
    this.checkRenderNetwork(nextProps.networkJSON);
  }

  checkRenderNetwork(networkJSON) {
    if (!this.state.networkRendered && !_.isEmpty(networkJSON)) { this.renderNetwork(networkJSON); }
  }

  // Graph rendering is not tracked by React
  renderNetwork(networkJSON) {
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(networkJSON);

    this.props.updateNetworkRenderStatus(true);

    this.setState({ networkRendered: true });

  }

  render() {
    return h('div.Graph', [
      h('div', {
        id: this.state.networkId,
        ref: dom => this.graphDOM = dom,
        style: {
          width: this.state.width,
          height: this.state.height
        }
      })
    ]);
  }
}

module.exports = Network;