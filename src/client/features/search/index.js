const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
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
      query: _.assign({q: '', gt: 2, lt: 250, type: 'Pathway'}, query),
      searchResults: [],
      dataSources: []
    };

    PathwayCommonsService.datasources()
    .then(result => this.setState({
      dataSources: result
      })
    );
  }

  getSearchResult() {
    const state = this.state;
    const query = state.query;

    if (query.q !== '') {
      PathwayCommonsService.querySearch(query)
      .then(searchResults => {
        this.setState({
          searchResults: searchResults
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

  setQueryType(e, type) {
    const newQueryState = _.assign({}, this.state.query);
    newQueryState.type = type;
    this.setState({query: newQueryState}, function () { this.submitSearchQuery(); });
  }

  submitSearchQuery() {
    const props = this.props;
    const state = this.state;

    const query = state.query;
    const uriRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

    if (query.q.match(uriRegex)) {
      props.history.push({
        pathname: '/view',
        search: queryString.stringify({uri: state.query.q}),
        state: {}
      });
    } else {
      props.history.push({
        pathname: '/search',
        search: queryString.stringify(query),
        state: {}
      });

      this.getSearchResult();
    }
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
          h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri})}, target: '_blank'}, [
            h('h3.search-item-content-title', result.name  || 'N/A'),
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
    });

    const searchTypes = [
      { name: 'Pathways', value: 'Pathway' },
      { name: 'Catalysis', value: 'Catalysis' },
      { name: 'Molecular Interactions', value: 'MolecularInteraction' },
      { name: 'Transcription/Translation', value: 'TemplateReactionRegulation' }
    ];

    const searchTypeTabs = searchTypes.map(searchType => {
      return h('div', {
        onClick: e => this.setQueryType(e, searchType.value),
        className: classNames('search-option-item', state.query.type === searchType.value ? 'search-option-item-active' : '')
      }, [
        h('a', searchType.name)
      ]);
    });

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
            h('div.search-tabs', searchTypeTabs)
          ])
        ])
      ]),
      h('div.search-list-container', [
        h('div.search-hit-counter', `${state.searchResults.length} results`),
        h('div.search-list', searchResults)
      ])
    ]);
  }
}

module.exports = Search;