const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { NS_GENE_ONTOLOGY, NS_REACTOME } = require('../../../config');
const { ServerAPI } = require('../../services');


class EnrichmentTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      name: '',
      description: '',
      descriptionLoaded: false
    };
  }

  componentDidMount(){
    let { node } = this.props;
    let id = node.data('id');
    const namespace = node.data('namespace');
    const descriptionOnFail = 'No description available';

    if( namespace === NS_GENE_ONTOLOGY ){
      ServerAPI.getGoInformation( id.replace('GO:', '') )
      .then( res => {
        let description = _.get(res, 'results[0].definition.text', descriptionOnFail);
        let update = () => this.setState({ name: NS_GENE_ONTOLOGY.toUpperCase(), description, descriptionLoaded: true });

        update();
      })
      .catch( () => this.setState({ name: NS_GENE_ONTOLOGY.toUpperCase(), descriptionLoaded: true }) );
    }

    if( namespace === NS_REACTOME ){
      ServerAPI.getReactomeInformation( id.replace('REAC:', '') )
      .then( res => {
        let description = _.get(res, 'summation[0].text', descriptionOnFail);
        let update = () => this.setState({ name: NS_REACTOME.toUpperCase(), description, descriptionLoaded: true });

        update();
      })
      .catch( () => this.setState({ name: NS_REACTOME.toUpperCase(), descriptionLoaded: true }) );
    }
  }
  render(){
    let {node} = this.props;
    let { description, name } = this.state;
    let title = node.data('name');
    // See #1348 https://github.com/PathwayCommons/app-ui/issues/1348
    // let sharedGeneList = node.data('intersection').sort();
    // let sharedGeneCount = sharedGeneList.length;
    let url = node.data('uri');

    if( !this.state.descriptionLoaded ){
      return h('div.cy-tooltip', [
        h('div.cy-tooltip-content', [
          h('div.cy-tooltip-header',[
            h('h2.cy-tooltip-title', 'Loading...')
          ]),
          h('div.cy-tooltip-body', [
            h('div.cy-tooltip-loading-section', [
              h('i.icon.icon-spinner')
            ])
          ])
        ])
      ]);
    }

    const descriptionSection = description ? h('div.cy-tooltip-section', [
      h('div.cy-tooltip-field-name', 'Description'),
      h('div.cy-tooltip-field-value', description)
    ]) : null;

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-content', [
        h('div.cy-tooltip-header',[
          h('h2.cy-tooltip-title', [
            h('a.plain-link', { href: url, target: '_blank', }, title[0].toUpperCase() + title.substr(1) ),
            h('div.cy-tooltip-type-chip', name )
          ])
        ]),
        h('div.cy-tooltip-body', [
          descriptionSection,
          // See #1348 https://github.com/PathwayCommons/app-ui/issues/1348
          // h('div.cy-tooltip-section', [
          //   h('div.cy-tooltip-field-name', 'Genes Shared with Entered List (' + sharedGeneCount + ')'),
          //   h('div.cy-tooltip-field-value', sharedGeneList.join(', ')),
          // ])
        ]),
        h('div.cy-tooltip-call-to-action', [
          h('a', {
            target: '_blank',
            href: '/search?q=' + title
            }, [
              h('button.call-to-action', 'Find Related Pathways')
          ])
        ])
      ])
    ]);
  }
}

module.exports = EnrichmentTooltip;