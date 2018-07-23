const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class InteractionsFilterMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = props;
    this.sliderUpdate = _.debounce(this.sliderUpdate,150);

    this.state.cySrv.loadPromise().then( cy => {
        let defaultVal = 0;

        let sortedNodes = cy.nodes().sort(function( a, b ){
          return b.data('bcVal') - a.data('bcVal');
        });
  
        sortedNodes.forEach(node => {
          if(!node.hasClass('hidden'))
            defaultVal = node.data('bcVal');
        });

        document.getElementById('selection-slider').value = defaultVal;

      });
  
  }

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
      if(node.data('bcVal') < sliderVal)
        node.addClass('hidden');
      else 
        node.removeClass('hidden');
    });
  }


  render(){
    const props= this.props;

    //Networks end up with all nodes next to 0 bcVal other than search term
    //slider becomes a toggle since noone has the dexterity to distinguish values at the low end
    //instead use the second highest bcVal as the maximum for slider, so its actually useful
    const buttons= _.map(props.filters,(active,type)=>
    h('div',{
        key:type,
        className:classNames ('interaction-filter-button', active ? 'interaction-filter-active':'interaction-filter-not-active'),
        onClick: () => props.filterUpdate(type)
      },
      [
        h('div',{className:classNames('interaction-filter-legend',{[type]:active})}),
        h('h3.button-label',type),
      ]
    ));

    //Slider listed under 'Visible Nodes' in the interaction viewer
    const slider = [
      h('input', {type: 'range', id: 'selection-slider', min: 0, max: 0.05, step: 0.0001,
      onInput:() => this.sliderUpdate() }),
    ];
    

    return h('div.sidebar-container',{style:{width:'100%'}},[
      h('h2', 'Interaction Filters'),
      buttons,
      h('h2.slider-heading','Visible Nodes'),
      h('div.slider-wrapper',slider),
      h('div.slider-bottom',[
        h('span.most','Most'),
        h('span.least','Least')
      ])
    ]);
  }
}
module.exports = InteractionsFilterMenu; 