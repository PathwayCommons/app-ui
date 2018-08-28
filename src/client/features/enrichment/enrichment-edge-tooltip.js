const React = require('react');
const h = require('react-hyperscript');

class EnrichmentEdgeTooltip extends React.Component {
  render(){
    let { edge }= this.props;

    let sourceDescription = edge.data('sourceDescription');
    let targetDescription = edge.data('targetDescription');
    let intersection = edge.data('intersection');
    let intersectionCount = intersection.length;

    return h('div.enrichment-tooltip', [
      h('div.enrichment-tooltip-header',[
        h('h2.enrichment-tooltip-title', sourceDescription ),
        h('span', ` and ` ),
        h('h2.enrichment-tooltip-title', targetDescription ),
      ]),
      h('div.enrichment-tooltip-body', [
        h('div.enrichment-tooltip-field-name', 'Intersection (' + intersectionCount + ')'),
        h('div.enrichment-tooltip-field-value', intersection.join(', '))
      ])
      // h('div.enrichment-tooltip-footer', [
        // h('a.plain-link', { href: dbInfo.url, target: '_blank', }, dbInfo.name)
      // ])
    ]);
  }
}

module.exports = EnrichmentEdgeTooltip;