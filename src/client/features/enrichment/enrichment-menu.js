const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

class EnrichmentMenu extends React.Component {

  /**
   *
   * @param {*} degreeValues array returned by getUniqueDegreeValues
   * @description Hides nodes based on their betweenness centrality, determined by on-screen slider
   */
  sliderUpdate(){
    const cy = this.props.cySrv.get();

    //get the value from the slider
    let sliderVal = document.getElementById('selection-slider').value;

    //compare to pre-calculated centrality & hide if necessary
    cy.nodes().forEach(node => {
      if(node.data('p_value') > sliderVal)
        node.addClass('hidden');
      else
        node.removeClass('hidden');
    });
  }

  render(){

    //Slider listed under 'Visible Nodes' in the interaction viewer
    const slider = [
      h("input",{type:"range",id:'selection-slider',min:0,max:0.05,step:0.0001,defaultValue:0,
      onInput:() => this.sliderUpdate() }),
    ];

    return h(Tabs, [
      h('div.enrichment-drawer-header', [
        h('h2', 'Enriched Network'),
        h(TabList, [
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
            }, 'Legend')
        ])
      ]),
      h(TabPanel, [
        h('h3', 'Significance'),
        h('div.enrichment-legend-container', [
          h('div.enrichment-legend-stat-significant', [
            h('p', `high 0`),
            h('p', '.025'),
            h('p', `low .05`)
          ]),
          h('div.enrichment-legend-not-significant', [
            h('p', ` none >.05`)
          ])
        ])
      ]),
      h('h3.slider-heading','Visible Nodes'),
      h('div.slider-wrapper',slider),
      h('div.slider-bottom',[
        h('span.most','Least'),
        h('span.least','Most')
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;