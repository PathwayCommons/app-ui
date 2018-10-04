const React = require('react');
const h = require('react-hyperscript');

class InteractionsNodeTooltip extends React.Component {
  render(){
    let { node } = this.props;
    let title = node.data('id');
    let links = [];

    links.push({ name: 'HGNC', url: 'http://identifiers.org/hgnc.symbol/' + node.data('id') });

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header', [
        h('h2.cy-tooltip-title', title)
      ]),
      links.length > 0 ? h('div.cy-tooltip-footer', [
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', [
            'Links'
          ]),
          h('div.cy-tooltip-links', links.map(link => {
            let { name, url } = link;
            return h('a.plain-link', { href: url, target: '_blank'  }, name);
          }))
        ])
      ]) : null,
      h('div.cy-tooltip-call-to-action', [
        h('a', {
          target: '_blank',
          href: '/search?q=' + title
        }, [
          h('button.call-to-action', `Find Related Pathways`)
        ])
      ])
    ]);
  }
}

module.exports = InteractionsNodeTooltip;