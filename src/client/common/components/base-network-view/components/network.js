const React = require('react');
const h = require('react-hyperscript');

const _ = require('lodash');

/* Props
- cy
- networkJSON
- initialLayoutOpts
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
    this.renderNetwork(this.props.networkJSON);
  }

  // Graph rendering is not tracked by React
  renderNetwork(networkJSON) {
    const props = this.props;
    const cy = props.cy;

    cy.remove('*');
    cy.add(networkJSON);
    cy.layout(props.initialLayoutOpts).run();

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