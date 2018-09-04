const React = require('react');
const h = require('react-hyperscript');

class InteractionsEdgeTooltip extends React.Component {
  render(){
    let { edge } = this.props;
    let title = edge.data('id');

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ])
      // h('div.cy-tooltip-body', [
      // ])
      // h('div.cy-tooltip-footer', [
      // ]),

    ]);
  }
}

module.exports = InteractionsEdgeTooltip;