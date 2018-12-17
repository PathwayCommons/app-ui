const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { NS_GENECARDS, NS_NCBI_GENE, NS_HGNC_SYMBOL, NS_UNIPROT } = require('../../../config');

const { ServerAPI } = require('../../services');
class InteractionsNodeTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      entitySummary: {},
      entitySummaryLoaded: false
    };
  }

  componentDidMount(){
    let { node } = this.props;
    let query = node.data('id');
    ServerAPI.entitySummaryQuery( query ).then( summary => {
      this.setState({ entitySummary: summary, entitySummaryLoaded: true });
    } );
  }

  render(){
    let { node } = this.props;
    let { entitySummary, entitySummaryLoaded } = this.state;
    let xrefLinks = _.get(entitySummary, '0.summary.xrefLinks', []);
    let description = _.get(entitySummary, '0.summary.description', '');
    let title = node.data('id');
    let links = [];

    if( !entitySummaryLoaded ){
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

    links.push({ name: 'HGNC', url: xrefLinks.find( link => link.namespace === NS_HGNC_SYMBOL ).uri });
    links.push({ name: 'UniProt', url: xrefLinks.find( link => link.namespace === NS_UNIPROT ).uri });
    links.push({ name: 'NCBI Gene', url: xrefLinks.find( link => link.namespace === NS_NCBI_GENE ).uri });
    links.push({ name: 'Gene Cards', url: xrefLinks.find( link => link.namespace === NS_GENECARDS ).uri });

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header', [
        h('h2.cy-tooltip-title', title )
      ]),
      h('div.cy-tooltip-body', [
        description != '' ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Description'),
          h('div.cy-tooltip-field-value', description)
        ]) : null
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