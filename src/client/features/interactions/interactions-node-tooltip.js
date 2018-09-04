const React = require('react');
const h = require('react-hyperscript');

class InteractionsNodeTooltip extends React.Component {
  render(){
    let { node } = this.props;
    let title = node.data('id');
    let types = node.data('types');
    let externalIds = Object.entries(node.data('externalIds'));

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title),
        ...types.map( t => h('div.cy-tooltip-type-chip', t))
      ]),
      h('div.cy-tooltip-footer', [
        h('div.cy-tooltip-field-name', [
          'Links',
          // h('i.material-icons', 'keyboard_arrow_right')
        ]),
        h('div.cy-tooltip-links', externalIds.map( eId => {
          let [externalDb, externalDbId] = eId;
          return h('a.plain-link', { href: externalDbId, target: '_blank'}, externalDb);
        }))
      ]),
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