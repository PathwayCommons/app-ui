const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');

const queryString = require('query-string');
const _ = require('lodash');

const { ServerAPI } = require('../../services');
const Datasources = require('../../../models/datasources');

const PcLogoLink = require('../../common/components/pc-logo-link');
const EntitySummaryBoxList = require('./entity-summary-box');

class Search extends React.Component {

  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({
        q: '',
        gt: 0,
        lt: 250,
        type: 'Pathway',
        datasource: []
      }, query),
      entitySummaryResults: {},
      entitySummaryResultsLoading: false,
      searchResults: [],
      searchLoading: false
    };
  }

  getSearchResult() {
    const state = this.state;
    const query = state.query;
    if (query.q !== '') {
      this.setState({
        searchLoading: true,
        entitySummaryResultsLoading: true
      });
      ServerAPI.entitySummaryQuery( query.q )
        .then( entitySummaryResults => {
          this.setState({ entitySummaryResults });
        })
        .catch( () => {} ) // swallow
        .finally(() => {
          this.setState({ entitySummaryResultsLoading: false });
        });
      ServerAPI.search(query)
        .then( searchResults => {
          this.setState({ searchResults });
        })
        .finally( () => {
          this.setState({ searchLoading: false });
        });
    }
  }

  componentDidMount() {
    this.getSearchResult();
  }

  onSearchValueChange(e) {
    // if the user presses enter, submit the query
    if (e.which && e.which === 13) {
      this.submitSearchQuery(e);
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({ query: newQueryState });
    }
  }

  setAndSubmitSearchQuery(query) {
    const state = this.state;
    if (!state.searchLoading) {
      const newQueryState = _.assign({}, state.query, query);
      this.setState({ query: newQueryState }, () => this.submitSearchQuery());
    }
  }

  submitSearchQuery() {
    const props = this.props;
    const state = this.state;
    const query = state.query;

    props.history.push({
      pathname: '/search',
      search: queryString.stringify(query),
      state: {}
    });
    this.getSearchResult();
  }

  componentWillReceiveProps (nextProps) {
    const nextSearch = nextProps.location.search;
    if( this.props.location.search !==  nextSearch){
      this.setState({
        query: _.assign({
          q: '',
          gt: 0,
          lt: 250,
          type: 'Pathway',
          datasource: []
          }, queryString.parse(nextSearch))} , ()=>{
            this.getSearchResult();
          });
    }
  }

  render() {
    const state = this.state;
    const entitySummaryResults = state.entitySummaryResults;
    const loaded = !(state.searchLoading || state.entitySummaryResultsLoading);

    const searchResults = state.searchResults.map(result => {
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

    const searchResultFilter = h('div.search-filters', [
      h('select.search-datasource-filter', {
        value: !Array.isArray(state.query.datasource) ? state.query.datasource : '',
        multiple: false,
        onChange: e => this.setAndSubmitSearchQuery({ datasource: e.target.value })
      }, [
        h('option', { value: [] }, 'Any datasource')].concat(
          Datasources.pathwayDatasources().map( ds => h('option', { value: [ds.id ] }, ds.name ))
          )),
    ]);

    const searchResultHitCount = h('div.search-hit-counter', `${state.searchResults.length} result${state.searchResults.length === 1 ? '' : 's'}`);

    const notFoundErrorMessage = h('div.search-error', [
      h('h1', 'We can\'t find the the resource you are looking for'),
      h('p', [
        h('span', 'If difficulties persist, please report this to our '),
        h('a.plain-link', { href: 'mailto: pathway-commons-help@googlegroups.com' }, 'help forum.')
      ])
    ]);

    const searchListing = h(Loader, { loaded: loaded, options: { left: '50%', color: '#16A085' } }, [
      h('div.search-list-container', [
        h('div.search-tools', [
          h('div.search-result-filter', [searchResultFilter]),
          h('div.search-result-hit-count', [searchResultHitCount])
        ]),
        !_.isEmpty(entitySummaryResults) > 0 ? h(EntitySummaryBoxList, { entitySummaryResults }) : null,
        h('div.search-list', searchResults)
      ])
    ]);

    const searchBody =  this.props.notFoundError ? notFoundErrorMessage : searchListing;

    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h('div.search-branding', [
            h('div.search-title', [
              h(PcLogoLink, { className: 'search-logo'})
            ]),
            h('div.search-branding-descriptor', [
              h('h2.search-pc-title', 'Pathway Commons'),
              h('h1.search-search-title', 'Search')
            ])
          ]),
          h('div.search-searchbar-container', {
            ref: dom => this.searchBar = dom
          }, [
              h('div.search-searchbar', [
                h('input', {
                  type: 'text',
                  placeholder: 'Enter pathway name or gene names',
                  value: state.query.q,
                  onChange: e => this.onSearchValueChange(e),
                  onKeyPress: e => this.onSearchValueChange(e)
                }),
                h(Link, { to: { pathname: '/search', search: queryString.stringify(state.query)},className:"search-search-button"}, [
                  h('i.material-icons', 'search')
                ])
              ]),
              h('div.search-suggestions', [
                'e.g. ',
                h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, state.query, {q: 'cell cycle'})) }}, 'cell cycle, '),
                h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, state.query, {q: 'TP53 MDM2'})) }}, 'TP53 MDM2, '),
                h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, state.query, {q: 'P04637'})) }}, 'P04637')
              ])
            ])
        ])
      ]),
      h('div.search-body', [searchBody])
    ]);
  }
}

module.exports = Search;
