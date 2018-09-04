const React = require('react');
const h = require('react-hyperscript');

class InteractionsEdgeTooltip extends React.Component {
  render(){
    let { edge } = this.props;
    let title = edge.data('id');
    let pubmedIds = edge.data('pubmedIds');
    let pcIds = edge.data('pcIds');
    let reactomeIds = edge.data('reactomeIds');
    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ]),
      h('div.cy-tooltip-body', [
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Publications'),
          h('div.cy-tooltip-field-value', pubmedIds)
        ]),
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Pathway Commons Links'),
          h('div.cy-tooltip-field-value', pcIds)
        ]),
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Reactome Links'),
          h('div.cy-tooltip-field-value', reactomeIds)
        ])
      ])
      // h('div.cy-tooltip-footer', [
      // ]),

    ]);
  }
}

module.exports = InteractionsEdgeTooltip;