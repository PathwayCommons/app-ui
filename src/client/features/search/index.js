const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');
const extend = require('extend');

const SearchHeader = require('./search-header');
const SearchList = require('./search-list');

const Icon = require('../../common/components').Icon;

class Search extends React.Component {
  render() {
    const props = this.props;
    const state = this.state;

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
              // value: state.query.q,
            }),
            h('div.search-filter-icon', [
              h('a', [
                h(Icon, {icon: 'filter_list'})
              ])
            ])
          ])
        ])
      ])
    ]);
  }
}

module.exports = Search;