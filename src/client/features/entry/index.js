const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const _ = require('lodash');

const Icon = require('../../common/components').Icon;


// requires react router props
class Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: _.assign({q: '', gt: 3, lt: 250, type: 'Pathway'}, this.props.query)
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
    }
  }

  render() {
    const state = this.state;
    return h('div.entry', [
      h('div.entry-header', [
        h('a.entry-pc-link', {
          href: 'https://www.pathwaycommons.org'
        }, [
          h('img.entry-logo')
        ]),
        h('div.entry-title', [
          h('h2.entry-pc-title', 'athway Commons'),
          h('h5.entry-pc-description', 'Search pathways from public databases')
        ]),
        h('div.entry-search', [
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
              },[
              h(Icon, {icon: 'search'})
            ])
          ])
        ])
      ])
    ]);
  }
}

module.exports = Entry;