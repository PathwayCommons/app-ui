const React = require('react');
const h = require('react-hyperscript');

const Icon = require('../../common/components').Icon;
const SearchBar = require('../../common/components').SearchBar;

class Entry extends React.Component {
  render() {
    return h('div.entry', [
      h('div.entry-header', [
        h('a.entry-pc-link', {
          href: 'http://www.pathwaycommons.org'
        }, [
          h('img.entry-logo')
        ]),
        h('div.entry-title', [
          h('h2.entry-pc-title', 'athway Commons'),
          h('h5.entry-pc-description', 'Search pathways from public databases')
        ]),
        h('div.entry-search', [
          h(SearchBar, {
            className: 'entry-searchbar',
            placeholder: 'Enter pathway name or gene names',
            query: {}
          }),
          h('div.entry-searchicon', [
            h('a', [
              h(Icon, {icon: 'search'})
            ])
          ])
        ])
      ])
    ]);
  }
}

module.exports = Entry;