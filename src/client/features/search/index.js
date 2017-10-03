const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;

class Search extends React.Component {

  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({q: '', gt: 3, lt: 250}, query),
      searchResults: []
    };
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

      PathwayCommonsService.querySearch(query)
        .then(searchResults => {
          this.setState({
            searchResults: searchResults.searchHit ? searchResults.searchHit : []
          });
        });
    }
  }

  render() {
    const props = this.props;
    const state = this.state;

    const searchResults = state.searchResults.map(result => {
      return h('div', [
        h('h2', result.name),
        h('div', `datasource: ${result.dataSource[0]}`),
        h('div', `datasource image here`),
        h('div', `size: ${result.numParticipants}`)
      ]);
    });

    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h('a.search-pc-link', {
            href: 'https://www.pathwaycommons.org'
          }, [
            h('img.search-logo')
          ]),
          h('div.search-searchbar', [
            h('input', {
              type: 'text',
              placeholder: 'Enter pathway name or gene names',
              value: state.query.q,
              onChange: e => this.onSearchValueChange(e),
              onKeyPress: e => this.onSearchValueChange(e)
            }),
            h('div.search-filter-icon', [
              h('a', [
                h(Icon, {icon: 'filter_list'})
              ])
            ])
          ])
        ])
      ]),
      h('div.search-list-container', [
        h('div.search-list', searchResults)
      ])
    ]);
  }
}

module.exports = Search;