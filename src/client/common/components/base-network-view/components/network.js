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
    const props = this.props;
    const initialLayoutOpts = props.initialLayoutOpts;
    const container = this.graphDOM;

    const cy = props.cy;    
    cy.mount(container);
    cy.remove('*');
    cy.add(props.networkJSON);
    
    const layout = cy.layout(initialLayoutOpts);
    layout.on('layoutstop', () => this.setState({ networkRendered: true}));
    layout.run();
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