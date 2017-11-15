const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const queryString = require('query-string');
const _ = require('lodash');

const Icon = require('../../common/components').Icon;

// requires react router props
class Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: _.assign({ q: '', gt: 2, lt: 250, type: 'Pathway' }, this.props.query)
    };
  }

  onSearchValueChange(e) {
    // if the user presses enter, submit the query
    if (e.which && e.which === 13) {
      this.submitSearchQuery();
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({ query: newQueryState });
    }
  }

  submitSearchQuery() {
    this.props.history.push({
      pathname: '/search',
      search: queryString.stringify(this.state.query),
      state: {}
    });
  }

  render() {
    const state = this.state;

    const exampleSearches = ['TP53', 'Glycolysis', 'Ethanol'];

    let examples = exampleSearches.map(search => {
      const newQueryState = _.assign({}, state.query);
      newQueryState.q = search;
      return h(Link, { to: { pathname: '/search', search: queryString.stringify(newQueryState) } }, [
        h('span.entry-example', search),
      ]);
    });

    let i = 1;
    while (i < examples.length) {
      examples.splice(i, 0, ', ');
      i += 2;
    }

    return h('div.entry', [
      h('div.entry-content', [
        h('div.entry-header', [
          h('a.entry-pc-link', {
            href: 'https://www.pathwaycommons.org'
          }, [
              h('i.entry-logo')
            ]),
          h('div.entry-title', [
            h('h1.entry-pc-title', 'Pathway Commons'),
            h('h5.entry-pc-description', 'A web resource for biological pathway data')
          ])
        ]),
        h('div.entry-search-stripe', [
          h('div.entry-search-content', [
            h(Link, { to: { pathname: '/search' } }, [
              h('span.entry-search-title', 'Search')
            ]),
            h('div.entry-search-bar', [
              h('input', {
                type: 'text',
                placeholder: 'Enter pathway name or gene names',
                value: state.query.q,
                onChange: e => this.onSearchValueChange(e),
                onKeyPress: e => this.onSearchValueChange(e)
              }),
              h('div.entry-search-button', [
                h('button', {
                  onClick: e => this.submitSearchQuery(e)
                }, [
                    h(Icon, { icon: 'search' })
                  ])
              ])
            ]),
            h('div.entry-suggestions', ['e.g. '].concat(examples))
          ])
        ])
      ])
    ]);
  }
}

module.exports = Entry;