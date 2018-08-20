const React = require('react');
const h = require('react-hyperscript');

class InteractionsTooltip extends React.Component {
  render(){
    let { node } = this.props;
    let title = node.data('label');

    return h('div.metadata-tooltip', [
      h('div.metadata-tooltip-header',[
        h('h2.metadata-tooltip-title', title)
      ]),
      h('div.metadata-tooltip-body', [

      ]),
      // h('div.metadata-tooltip-footer', [
         // TODO: fill with metadata
      // ]),
      h('div.metadata-search-call-to-action', [
        h('a.metadata-find-pathways', {
          target: '_blank',
          href: '/search?q=' + title
          },
          `FIND RELATED PATHWAYS`
        )
      ])
    ]);
  }
}

module.exports = InteractionsTooltip;