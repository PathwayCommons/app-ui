const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');

const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;

class Search extends React.Component {

  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({
        q: '',
        gt: 2,
        lt: 250,
        type: 'Pathway',
        datasource: []
      }, query),
      searchResults: [],
      loading: false,
      showFilters: false,
      dataSources: []
    };

    PathwayCommonsService.datasources()
    .then(result => {
      this.setState({
        dataSources: Object.values(result)
      });
    });
  }

  getSearchResult() {
    const state = this.state;
    const query = state.query;

    if (query.q !== '') {
      this.setState({
        loading: true
      });
      PathwayCommonsService.querySearch(query)
      .then(searchResults => {
        this.setState({
          searchResults: searchResults,
          loading: false
        });
      });
    }
  }

  componentDidMount() {
    this.getSearchResult();
  }

  onSearchValueChange(e) {
    // if the user presses enter, submit the query
    if (e.which && e.which ===  13) {
      this.submitSearchQuery(e);
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({query: newQueryState});
    }
  }

  setQueryState(query) {
    const state = this.state;
    if (!state.loading) {
      const newQueryState = _.assign({}, state.query, query);
      this.setState({query: newQueryState}, () => this.submitSearchQuery());
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

  render() {
    const props = this.props;
    const state = this.state;

    const searchResults = state.searchResults.map(result => {
      const dsInfo = _.find(state.dataSources, ds => {
        return ds.uri === result.dataSource[0];
      });

      return h('div.search-item', [
        h('div.search-item-icon', [
          h('img', {src: dsInfo.iconUrl})
        ]),
        h('div.search-item-content', [
          h(Link, {to: {pathname: '/paint', search: queryString.stringify({uri: result.uri})}, target: '_blank'}, [
            h('h3.search-item-content-title', result.name  || 'N/A'),
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
    });

    const searchTypeTabs = [
      { name: 'Pathways', value: 'Pathway' },
      { name: 'Molecular Interactions', value: 'MolecularInteraction' },
      { name: 'Reactions', value: 'Control' },
      { name: 'Transcription/Translation', value: 'TemplateReactionRegulation' }
    ].map(searchType => {
      return h('div', {
        onClick: e => this.setQueryState({type: searchType.value}),
        className: classNames('search-option-item', state.loading ? 'search-option-item-disabled' : '', state.query.type === searchType.value ? 'search-option-item-active' : '')
      }, [
        h('a', searchType.name)
      ]);
    });

    const searchResultInfo = state.showFilters ? h('div.search-filters', [
      h('select.search-datasource-filter', {onChange: e => this.setQueryState({datasource: e.target.value})}, [
        h('option', {value: [], selected: state.query.datasource === []}, 'datasource: any')].concat(
        _.sortBy(state.dataSources, 'name').map(ds => h('option', {value: ds.id, selected: state.query.datasource === ds.id }, ds.name))
      )),
    ]) :
    h('div.search-hit-counter', `${state.searchResults.length} results`);


    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h(Link, { className: 'a.search-pc-link', to: {pathname: '/'} }, [
            h('i.search-logo')
          ]),
          h(Link, { className: 'search-pc-title', to: {pathname: '/'} }, [
            h('h2', 'Pathway'),
            h('h2', 'Commons')
          ]),
          h('div.search-searchbar-container', [
            h('div.search-searchbar', [
              h('input', {
                type: 'text',
                placeholder: 'Enter pathway name or gene names',
                value: state.query.q,
                onChange: e => this.onSearchValueChange(e),
                onKeyPress: e => this.onSearchValueChange(e)
              }),
              h('div.search-search-button', [
                h('button', { onClick: e => this.submitSearchQuery(e) }, [
                  h(Icon, {icon: 'search'})
                ])
              ])
            ]),
            h('div.search-tabs', searchTypeTabs.concat([
                h('div', {
                  className: classNames('search-option-item', state.loading ? 'search-option-item-disabled' : '', 'search-tools', state.showFilters ? 'search-option-item-active' : ''),
                  onClick: e => this.setState({showFilters: !state.showFilters})
                }, [
                  h('a', 'Tools')
                ])
              ]
            ))
          ])
        ])
      ]),
      h(Loader, { loaded: !state.loading, options: {left: '525px', color: '#16A085' } }, [
        h('div.search-list-container', [
          h('search-result-info', [ searchResultInfo ]),
          h('div.search-list', searchResults)
        ])
      ])
    ]);
  }
}

module.exports = Search;