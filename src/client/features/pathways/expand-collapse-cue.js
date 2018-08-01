const React = require('react');
const h = require('react-hyperscript');

// A expand/collapse cue indicator for cytoscape nodes

// props:
// - node (Cytoscape node)
class ExpandCollapseCue extends React.Component {
  constructor(props){
    super(props);
    let { node } = this.props;
    let ecAPI = node._private.cy.expandCollapse('get');

    this.state = {
      collapsed: !ecAPI.isCollapsible(node)
    };
  }

  handleClick(){
    let { node } = this.props;
    let { collapsed } = this.state;
    let ecAPI = node._private.cy.expandCollapse('get');

    if( collapsed ){
      ecAPI.expandRecursively(node);
    } else {
      ecAPI.collapseRecursively(node);
    }

    this.setState({
      collapsed: !collapsed
    });
  }

  render(){
    let { collapsed } = this.state;
    return h('div.expand-collapse-cue', { onClick: () => this.handleClick() }, [
      h('i.material-icons', collapsed ? 'unfold_more' : 'unfold_less')
    ]);
  }
}


module.exports = ExpandCollapseCue;