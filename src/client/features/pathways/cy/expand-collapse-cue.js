const React = require('react');
const ReactDom = require('react-dom');
const hh = require('hyperscript');
const h = require('react-hyperscript');
const tippy = require('tippy.js');

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

// This metadata tip is only for entities i.e. nodes
// TODO make an edge metadata tip for edges (for the interactions app)
class ExpandCollapseCueTip {
  constructor(node) {
    this.node = node;
    this.tooltip = null;
  }

  show() {
    let getContentDiv = component => {
      let div = hh('div');
      ReactDom.render( component, div );
      return div;
    };

    if( this.tooltip != null ){
      this.tooltip.destroy();
      this.tooltip = null;
    }


    let rbb = this.node.renderedBoundingBox({
      includeLabels: false
    });
    let refObject = this.node.popperRef({
      renderedPosition: () => ({ x: rbb.x1, y: rbb.y1}),
      renderedDimensions: () => ({w: -5, h: -5})
    });
    let tooltip = tippy(refObject, {
      html: getContentDiv( h(ExpandCollapseCue, { node: this.node, } )),
      theme: 'dark',
      interactive: true,
      trigger: 'manual',
      hideOnClick: false,
      arrow: false,
      placement: 'bottom-end',
      offset: '50, 0',
      flip: false,
      distance: 0}
    ).tooltips[0];

    this.tooltip = tooltip;
    this.tooltip.show();
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  }
}

module.exports = ExpandCollapseCueTip;