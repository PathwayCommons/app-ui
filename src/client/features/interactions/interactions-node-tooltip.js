const React = require('react');
const h = require('react-hyperscript');

class InteractionsNodeTooltip extends React.Component {
  render(){
    let { node } = this.props;
    let title = node.data('id');

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ]),
      // h('div.cy-tooltip-body', [
         // TODO: fill with metadata
      // ]),
      // h('div.cy-tooltip-footer', [
         // TODO: fill with metadata
      // ]),
      h('div.cy-tooltip-call-to-action', [
        h('a.cy-tooltip-call-to-action-btn', {
          target: '_blank',
          href: '/search?q=' + title
          },
          `FIND RELATED PATHWAYS`
        )
      ])
    ]);
  }
}

module.exports = InteractionsNodeTooltip;