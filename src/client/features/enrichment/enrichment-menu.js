const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');

class EnrichmentMenu extends React.Component {
  /**
   *  @description Hides nodes based on adjusted p_value, determined by on-screen slider
   */
  sliderUpdate(){
    //get value from slider
    let sliderVal = document.getElementById('enrichment-p_value-slider').value;
    this.props.controller.updateSlider(sliderVal);
    this.filterNodes(sliderVal);
  }

  filterNodes(sliderVal){
    //compare p_values and hide if outside of chosen threshold
    const cy = this.props.cySrv.get();
    cy.nodes().forEach(node => {
      if(node.data('p_value') > sliderVal)
        node.addClass('hidden');
      else
        node.removeClass('hidden');
    });
  }

  render(){

    let { invalidTokens, sliderVal } = this.props;

    const slider = [
      h("input",{type:"range",id:'enrichment-p_value-slider',min:0,max:0.05,step:0.0001,defaultValue:sliderVal,
      onInput:() => this.sliderUpdate() })
    ];

    this.filterNodes(sliderVal);

    const unrecognizedTokens = invalidTokens.length === 0 ? '' : [
        h('h3', 'Unrecognized Genes (' + invalidTokens.length + ')'),
        h('div', invalidTokens.join(", "))
      ];

    return h(Tabs, [
      h('div.enrichment-drawer-header', [
        h('h2', 'Enrichment App'), //******************* CHANGE TO NEW NAME ONCE CHOSEN
        h(TabList, [
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
            }, 'Data'),
          h(Tab, {
            className: 'enrichment-drawer-tab',
            selectedClassName: 'enrichment-drawer-tab-selected'
          }, 'FAQ')
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
        h('div.enrichment-slider-wrapper', slider),
        h('div.unrecognized-token-container', unrecognizedTokens),
      ]),
      h(TabPanel, [
        h('h4', `What does it do?`),
        h('p', `This app identifies biological pathways that contain your genes of interest and displays them as an interactive network,
          allowing you to explore individual pathways.
          Pathways are drawn from Reactome (v56) and Gene Ontology, Biological Process (Ensembl v90 / Ensembl Genomes v37).`),

        h('h4', `What kinds of inputs are accepted?`),
        h('p', `This app will recognize:`),
        h('p', [
          h('li.gene-identifier-list', `HUGO Gene Nomenclature (HGNC) symbols (e.g. 'TP53') and IDs (e.g. 'HGNC:11998')`),
          h('li.gene-identifier-list', `UniProt protein accessions (e.g. 'P04637')`),
          h('li.gene-identifier-list', `NCBI Gene gene IDs (e.g. '7157)`),
        ]),

        h('h4', `What do the elements of the network represent?`),
        h('p', `Each pathway is represented by a node (circle) whose size corresponds to the number of genes in that pathway.
          Pathways that share genes are connected by edges (lines) whose width corresponds to the number of shared genes.
          Click on a node to see more information about the pathway.`),

        h('h4', `How does the app identify pathways?`),
        h('p',[
          h('span',`The input gene list is compared to genes in each candidate pathway and a statistical score is calculated (adjusted p-value).
            Pathways with an adjusted p-value less than a threshold (0.05) are deemed 'enriched' for genes in the input list and are displayed in the network.
            This analysis is performed by gProfiler's g:GOst service (rev 1741 2017-10-19). Please refer to their `),
          h('a', {href: 'https://biit.cs.ut.ee/gprofiler/help.cgi?help_id=55', target:"_blank"}, 'documentation'),
          h('span', ` for further details.`)
        ])
      ])
    ]);
  }
}

module.exports = EnrichmentMenu;