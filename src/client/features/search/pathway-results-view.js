const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

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

    const searchList = pathwayResults.map( ( result, index ) => {
      let dsInfo = _.get( result, 'sourceInfo', '' );
      let iconUrl = dsInfo.iconUrl || '';
      let name = dsInfo.name || '';
      const pathwayTitle = result.name;      
      const topHit = index === 0;
      const hasPreview = result.previewUrl;
      const showPreview = topHit && hasPreview;
    
      let item;
      const itemLink = children => h(Link, { className: 'plain-link', to: { pathname: '/pathways', search: queryString.stringify({ uri: result.uri }) }, target: '_blank' }, children || 'N/A');
      const itemPreview = h('img.search-item-preview', {src: result.previewUrl});
      const itemInfo = title => h('div.search-item-info', [
        h('div.search-item-icon', [ 
          h('img', {src: iconUrl}) 
        ]),
        h('div.search-item-content', [
          title,         
          h('p.search-item-content-datasource', ` ${name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
      
      if( showPreview ){ 
        // Wrap the entire item in a link 
        item = itemLink([
          itemInfo( pathwayTitle ), 
          itemPreview
        ]);
      } else {
        // Associate the link with the content
        item = itemInfo( itemLink( pathwayTitle ) );
      } 
      
      return h('div.search-item', {
        className: classNames({ 'preview': showPreview })
      }, item );
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
