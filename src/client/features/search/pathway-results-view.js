const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');

const Datasources = require('../../../models/datasources');
const { ErrorMessage } = require('../../common/components/error-message');

class PathwayResultsView extends React.Component {
  render(){
    let { pathwayResults } = this.props;

    if( pathwayResults === null ){
      return null;
    } else if ( !pathwayResults.length ){
      return h( ErrorMessage, { title: 'Your search didn\'t match any pathways', footer: 'Try different keywords or gene names.'} );
    }

    const searchList = pathwayResults.map(result => {
      let datasourceUri = _.get(result, 'dataSource.0', '');
      let dsInfo = Datasources.findByUri(datasourceUri);
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

    return h('div.search-pathway-results', [
      h('div.search-tools', [
        h('h3.search-pathways-header', `Pathways (${searchList.length})`)
      ]),
      ...searchList
    ]);
  }
}

module.exports = { PathwayResultsView };