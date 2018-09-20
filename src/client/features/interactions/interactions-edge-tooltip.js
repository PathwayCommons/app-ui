const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');

const { ServerAPI } = require('../../services');

class InteractionsEdgeTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      datasources: []
    };

    // Update datasources content to get homepage?
    ServerAPI.datasources()
      .then(result => {
        this.setState({
          dataSources: result
        });
      });
  }

  render(){
    const state = this.state;
    let { edge } = this.props;

    let pubmedEntires = edge.data('pubmedEntries');
    let title = edge.data('id');
    let providers = edge.data('providers');
    let pcIds = edge.data('pcIds');

    let providersList = providers.map( provider => {
      const dsInfo = _.isEmpty(state.dataSources) ? {}: _.find(state.dataSources, ds => {
        return ds.id.toLowerCase() === provider.toLowerCase() ;
      });
      // Datasources service doesn't return homepage
      // return h('div', [ h('a.plain-link', { href: dsInfo.uri, target: '_blank' }, dsInfo.name) ]);
      return h('div', [ dsInfo.name] );
    });

    let publicationList = pubmedEntires.map( publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.cy-overflow-content', [
        h('a.plain-link', { href: 'http://identifiers.org/pubmed/' + id, target: '_blank' }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let detailedViewsList = pcIds.map( (pcId, index)  => {
      return h('a.plain-link', { href: '/pathways?' + queryString.stringify({ uri: pcId }), target: '_blank' }, `[ ${index + 1} ]`);
    } );

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ]),
      h('div.cy-tooltip-body', [
        providersList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Data Sources'),
          h('div', providersList)
        ]) : null,
        publicationList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Publications'),
          h('div', publicationList)
        ]) : null,
        detailedViewsList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Pathway Links'),
          h('div.cy-tooltip-links', detailedViewsList)
        ]) : null,
        // h('div.cy-tooltip-section', [
        //   h('div.cy-tooltip-field-name', 'Reactome Links'),
        //   h('div.cy-tooltip-field-value', reactomeIds)
        // ])
      ])
    ]);
  }
}

module.exports = InteractionsEdgeTooltip;