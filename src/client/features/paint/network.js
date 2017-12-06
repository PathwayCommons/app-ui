const React = require('react');
const h = require('react-hyperscript');

// props
// cy
class Network extends React.Component {
  componentWillUnmount() {
    this.props.cy.destroy();
  }

  componentDidMount() {
    const props = this.props;
    const container = document.getElementById('cy-container');
    props.cy.mount(container);
  }

  render() {
    return h('div.paint-graph', [ h(`div.#cy-container`, {style: {width: '100vw', height: '100vh'}}) ]);
  }

}

module.exports = Network;