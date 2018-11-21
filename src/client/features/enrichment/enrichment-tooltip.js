const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { ServerAPI } = require('../../services');


class EnrichmentTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      description: ''
    };
  }

  componentDidMount(){
    let { node } = this.props;
    let id = node.data('id');
    let isGOId = /^GO:\d+$/.test(id);
    let isReactomeId = /^REAC:\d+$/.test(id);


    if( isGOId ){
      ServerAPI.getGoInformation( id.replace('GO:', '') ).then( res => {
        let description = _.get(res, 'results[0].definition.text', '');

        if( description !== '' ){
          this.setState({ description });

        }
      });
    }

    if( isReactomeId ){
      ServerAPI.getReactomeInformation( id.replace('REAC:', 'R-HSA-') ).then( res => {
        let description = _.get(res, 'summation[0].text');

        if( description !== '' ){
          this.setState({ description });
        }
      });
    }


  }
  render(){
    let {node} = this.props;
    let { description } = this.state;
    let title = node.data('description');
    let id = node.data('id');
    let sharedGeneList = node.data('intersection').sort();
    let sharedGeneCount = sharedGeneList.length;
    let geneSet = node.data('geneSet').sort();
    let geneCount = node.data('geneCount');
    let dbInfo = {};

    if( id.includes('GO') ) dbInfo = {name: 'Gene Ontology', url:'http://identifiers.org/go/' + id};
    else if( id.includes('REAC') ) dbInfo = {name: 'Reactome', url:'http://identifiers.org/reactome/' + id.replace("REAC:", "R-HSA-") };

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ]),
      h('div.cy-tooltip-body', [
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Pathway Overview'),
          h('div.cy-tooltip-field-value', description)
        ]),
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Genes Shared with Entered List (' + sharedGeneCount + ')'),
          h('div.cy-tooltip-field-value', sharedGeneList.join(', ')),
        ]),
        h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Genes in Pathway (' + geneCount + ')'),
          h('div.cy-tooltip-field-value', geneSet.join(', '))
        ])
      ]),
      h('div.cy-tooltip-footer', [
        h('a.plain-link', { href: dbInfo.url, target: '_blank', }, dbInfo.name)
      ]),
      h('div.cy-tooltip-call-to-action', [
        h('a.call-to-action', {
          target: '_blank',
          href: '/search?q=' + title
          },
          `SEARCH PATHWAY`
        )
      ])
    ]);
  }
}

module.exports = EnrichmentTooltip;