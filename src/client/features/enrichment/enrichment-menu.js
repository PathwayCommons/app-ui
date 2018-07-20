const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

class EnrichmentMenu extends React.Component {

  /**
   *  @description Hides nodes based on their p_value, determined by on-screen slider
   */
  sliderUpdate(){
    const cy = this.props.cySrv.get();

    //get the value from the slider
    let sliderVal = document.getElementById('enrichment-selection-slider').value;

    //compare p_values and hide if outside of chosen threshold
    cy.nodes().forEach(node => {
      if(node.data('p_value') > sliderVal)
        node.addClass('hidden');
      else
        node.removeClass('hidden');
    });
  }

  render(){

    const slider = [
      //set min = 0.0001 to prevent all nodes from being hidden which will occur if min = 0
      h("input",{type:"range",id:'enrichment-selection-slider',min:0.0001,max:0.05,step:0.0001,defaultValue:0.05,
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
        h('h3', 'P-Value Cutoff'),
        h('div.enrichment-legend-container', [
          h('div.enrichment-legend', [
            h('p', '0'),
            h('p', '.025'),
            h('p', '.05')
          ])
        ]),
        h('div.enrichment-slider-wrapper', slider)
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;