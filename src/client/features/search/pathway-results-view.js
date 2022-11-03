const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');

const { ErrorMessage } = require('../../common/components/error-message');

class PathwayResultsView extends React.Component {
  render(){
    let { searchHits: pathwayResults, controller, query , dataSources, hasFeature } = this.props;
    const curDatasource = query.datasource;
    const sources = dataSources.filter( source => query.type === 'Pathway' ?
      !source.notPathwayData && source.numPathways :
      !source.notPathwayData && source.numInteractions );
    const noPathwaysMsg = h( ErrorMessage, { title: 'Your search didn\'t match any pathways', footer: 'Try different keywords or gene names.'} );

    if( pathwayResults === null ){
      return null;
    }

    const searchList = pathwayResults.map(result => {
      let dsInfo = _.get( result, 'sourceInfo', '' );
      let iconUrl = dsInfo.iconUrl || '';
      let name = dsInfo.name || '';

      return h('div.search-item', [
        h('div.search-item-icon',[
          h('img', {src: iconUrl})
        ]),
        h('div.search-item-content', [
          h(Link, { className: 'plain-link', to: { pathname: '/pathways', search: queryString.stringify({ uri: result.uri }) }, target: '_blank' }, [result.name || 'N/A']),
          h('p.search-item-content-datasource', ` ${name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
    });

    const searchResultFilter = h('div.search-filters', [
      h('select.search-datasource-filter', {
        value: !Array.isArray(curDatasource) ? curDatasource : '',
        multiple: false,
        onChange: e => controller.setAndSubmitSearchQuery({ datasource: e.target.value })
      }, [
        h('option', { value: [] }, 'Any datasource')].concat(
          sources.map( ds => h('option', { value: [ds.identifier ] }, ds.name ))
          )),
    ]);

    const header = h('h3.search-pathways-header', pathwayResults.length ? `Pathways (${searchList.length})`: null);
    const filter = pathwayResults.length || curDatasource.length ? searchResultFilter: null;
    const listing = pathwayResults.length || hasFeature ? searchList: [noPathwaysMsg];

    return h('div.search-pathway-results', [
      h('div.search-tools', [ header, filter ]),
      ...listing
    ]);
  }
}

module.exports = { PathwayResultsView };
