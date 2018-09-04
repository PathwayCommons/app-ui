const React = require('react');
const h = require('react-hyperscript');

class InteractionsEdgeTooltip extends React.Component {
  render(){
    let { edge } = this.props;
    let title = edge.data('id');

    return h('div.metadata-tooltip', [
      h('div.metadata-tooltip-header',[
        h('h2.metadata-tooltip-title', title)
      ])
      // h('div.metadata-tooltip-body', [
         // TODO: fill with metadata
      // ])
      // h('div.metadata-tooltip-footer', [
         // TODO: fill with metadata
      // ]),

    ]);
  }
}

module.exports = InteractionsEdgeTooltip;